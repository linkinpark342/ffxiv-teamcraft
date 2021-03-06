import { Component, OnInit } from '@angular/core';
import { CraftingAction } from '../../model/actions/crafting-action';
import { LocalizedDataService } from '../../../../core/data/localized-data.service';
import { I18nToolsService } from '../../../../core/tools/i18n-tools.service';
import { CraftingJob } from '../../model/crafting-job.enum';
import { TranslateService } from '@ngx-translate/core';
import { Reclaim } from '../../model/actions/buff/reclaim';
import { Simulation } from '../../simulation/simulation';

@Component({
  selector: 'app-macro-popup',
  templateUrl: './macro-popup.component.html',
  styleUrls: ['./macro-popup.component.less']
})
export class MacroPopupComponent implements OnInit {

  public macro: string[][] = [[]];

  public aactionsMacro: string[] = [];

  private readonly maxMacroLines = 15;

  public addEcho = true;

  public echoSeNumber = 1;

  public fixedEcho = false;

  public extraWait = 0;

  public breakOnReclaim = false;

  rotation: CraftingAction[];

  job: CraftingJob;

  simulation: Simulation;

  tooManyAactions = false;

  constructor(private l12n: LocalizedDataService, private i18n: I18nToolsService, private translator: TranslateService) {
  }

  public generateMacros(): void {
    this.macro = [[]];
    this.aactionsMacro = ['/aaction clear'];
    let totalLength = 0;
    const reclaimBreakpoint = this.simulation.clone().run(true).simulation.lastPossibleReclaimStep;
    this.rotation.forEach((action) => {
      let macroFragment = this.macro[this.macro.length - 1];
      // One macro is 15 lines, if this one is full, create another one.
      // Alternatively, if breaking on Reclaim is enabled, split there too.
      if ((this.breakOnReclaim && (macroFragment.length === reclaimBreakpoint + 1)) || macroFragment.length >= this.maxMacroLines) {
        this.macro.push([]);
        macroFragment = this.macro[this.macro.length - 1];
      }
      let actionName = this.i18n.getName(this.l12n.getCraftingAction(action.getIds()[0]));
      if (actionName.indexOf(' ') > -1 || this.translator.currentLang === 'ko') {
        actionName = `"${actionName}"`;
      }
      if (action.getLevelRequirement().job !== CraftingJob.ANY && action.getLevelRequirement().job !== this.job) {
        if (this.aactionsMacro.indexOf(`/aaction ${actionName}`) === -1) {
          this.aactionsMacro.push(`/aaction ${actionName}`);
        }
      }

      macroFragment.push(`/ac ${actionName} <wait.${action.getWaitDuration() + this.extraWait}>`);
      totalLength++;

      let doneWithChunk: boolean;
      if(this.breakOnReclaim && macroFragment.length === reclaimBreakpoint){
        doneWithChunk = true;
      } else if(macroFragment.length === 14 && this.addEcho && this.rotation.length > totalLength + 1) {
        doneWithChunk = true;
      }

      if (this.addEcho && doneWithChunk) {
        let seNumber: number;
        if (this.fixedEcho) {
          seNumber = this.echoSeNumber;
        } else {
          seNumber = Math.min(this.echoSeNumber - 1 + this.macro.length, 16);
        }
        macroFragment.push(`/echo Macro #${this.macro.length} finished <se.${seNumber}>`);
        totalLength++;
      }
    });
    if (this.macro[this.macro.length - 1].length < 15 && this.addEcho) {
      let seNumber: number;
      if (this.fixedEcho) {
        seNumber = this.echoSeNumber;
      } else {
        seNumber = Math.min(this.echoSeNumber + this.macro.length, 16);
      }
      this.macro[this.macro.length - 1].push(`/echo Craft finished <se.${seNumber}>`);
    }
    if (this.aactionsMacro.length < 10) {
      this.aactionsMacro.push(`/aaction ${this.i18n.getName(this.l12n.getCraftingAction(new Reclaim().getIds()[0]))}`);
    }
    if (this.aactionsMacro.length > 10) {
      this.tooManyAactions = true;
    }
    if (this.aactionsMacro.length > 0) {
      this.aactionsMacro.push('/echo Cross class setup finished <se.4>');
    }
  }

  getText(macro: string[]): string {
    return macro.join('\n');
  }

  ngOnInit() {
    this.generateMacros();
  }

}

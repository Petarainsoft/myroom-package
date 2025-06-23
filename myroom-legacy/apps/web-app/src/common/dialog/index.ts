import { TableDataManager } from 'client-core';
import {
  DialogMain,
  DialogText,
  DialogResult,
} from 'client-core/tableData/defines/System_Interface';
import { logger } from '../utils/logger';
import React from 'react';

const TELLER_SYSTEM = 'System';
// const TELLER_ANSWER = "Answer";
type HistoryData = {
  dialogId: string;
  answerId?: string;
};

export class DialogSystem {
  private _dialogId: string;

  private _dialogInfo: DialogMain | null = null;
  private _dialogMap: Map<string, DialogText> | null = null;
  private _curDialogId: string | null = null;
  private _answerId: string | null = null;
  // 현재 대화 id까지 포함.
  private _historyDialogIds: HistoryData[] = [];
  private _dialogResult: DialogResult | null = null;
  private _updateCallback: ((resetTextAnim: boolean) => void) | null = null;
  private _maxQuestionNum: number = 0;
  constructor(dialogId: string, dialogResultId?: string) {
    this._dialogId = dialogId;
    if (dialogResultId) {
      // dialogResultId 가 있는 경우 결과창을 보여주기 위해서.
      this._historyDialogIds = [{ dialogId: '0' }];
      this._dialogResult =
        TableDataManager.getInstance().findDialogResult(dialogResultId);
    }
    this._loadDialogData();
  }

  dispose() {
    this._updateCallback = null;
  }

  //-----------------------------------------------------------------------------------
  // ui 관련 함수
  //-----------------------------------------------------------------------------------
  setUpdateCallback(callback: ((resetTextAnim: boolean) => void) | null) {
    this._updateCallback = callback;
  }
  getDialogId(): string {
    return this._dialogId;
  }
  // 마이룸의 말풍선 textId
  getStartTextId(): string | undefined {
    return this._dialogInfo?.StartLocalKey;
  }
  // 대화창 layout 구성을 위한 정보들
  getDialogTitleId(): string | undefined {
    return this._dialogInfo?.TitleLocalKey;
  }
  getDialogNpcId(): string | undefined {
    const id = this._dialogInfo?.TellerModelItemID;
    if (this._isEmptyOrWhitespace(id)) return undefined;
    return id;
  }
  getTitleTextId(): string | undefined {
    return this._dialogInfo?.TitleLocalKey;
  }
  getTitleButtonTextId(): string | undefined {
    return this._dialogInfo?.TitleButtonLocalKey;
  }
  hasTitlePage(): boolean {
    return (
      this.getTitleButtonTextId() !== undefined &&
      this.getTitleButtonTextId() !== null &&
      this.getTitleButtonTextId() !== ''
    );
  }
  getTitleImage(): string | undefined {
    return this._dialogInfo?.TitleImageName;
  }
  // 대화 시스템 시작
  canStartDialog(): boolean {
    return this._dialogInfo !== null && this._dialogMap !== null;
  }
  isStartedDialog(): boolean {
    return this._curDialogId !== null;
  }

  isFinished(): boolean {
    return this._curDialogId === null && this._historyDialogIds.length > 0;
  }
  startDialog(): boolean {
    if (!this._dialogInfo) return false;
    this._curDialogId = this._dialogInfo.FirstDialogTextID;
    this._historyDialogIds = [{ dialogId: this._curDialogId }];
    return true;
  }
  retryDialog(): void {
    this._curDialogId = null;
    this._historyDialogIds = [];
  }
  isDialogQuestion(): boolean {
    if (!this._dialogMap || !this._curDialogId) return false;
    const dialogText = this._dialogMap.get(this._curDialogId);
    return dialogText?.TellerType === TELLER_SYSTEM;
  }
  getDialogQuestionId(): string | undefined {
    if (!this._dialogMap || !this._curDialogId) return;
    // 현재 answer상태일 수 있으니, 그 직전의 question id를 찾는다.
    for (let i = this._historyDialogIds.length - 1; i >= 0; i--) {
      const id = this._historyDialogIds[i].dialogId;
      const dialogText = this._dialogMap.get(id);
      if (dialogText && dialogText.TellerType === TELLER_SYSTEM) {
        return dialogText.LocalKey;
      }
    }
  }

  getQuestionIndex(): number {
    return this._historyDialogIds.length;
  }
  hasNextQuestion(): boolean {
    if (!this._dialogMap || !this._curDialogId) return false;
    const dialogText = this._dialogMap.get(this._curDialogId);
    if (dialogText && !this._isEmptyOrWhitespace(dialogText.NextID)) {
      const nextText = this._dialogMap.get(dialogText.NextID);
      if (nextText && nextText.TellerType === TELLER_SYSTEM) return true;
      else return false;
    } else {
      return false;
    }
  }
  getNpcAnimationId(): string | undefined {
    if (!this._dialogMap || !this._curDialogId) return;
    const dialogText = this._dialogMap.get(this._curDialogId);
    if (dialogText && !this._isEmptyOrWhitespace(dialogText.AnimationItemID)) {
      return dialogText.AnimationItemID;
    }
  }
  getDialogAnswerList(): DialogText[] | null {
    if (!this._dialogMap || !this._curDialogId) return null;
    const dialogText = this._dialogMap.get(this._curDialogId);
    if (dialogText && dialogText.AnswerID.length > 0) {
      const answerIds = dialogText.AnswerID;
      const answerList: DialogText[] = [];
      for (const answerId of answerIds) {
        const answerText = this._dialogMap.get(answerId);
        if (answerText) {
          answerList.push(answerText);
        }
      }
      return answerList.length > 0 ? answerList : null;
    } else {
      return null;
    }
  }
  selectAnswer(answerId: string) {
    this._answerId = answerId;
    this._updateCallback?.(false);
  }
  getSelectedAnswerId(): string | null {
    return this._answerId;
  }
  // return can go to next
  goToNext(): boolean {
    if (!this._dialogMap || !this._curDialogId) return false;
    if (!this.hasNextQuestion() && !this._answerId) {
      return false;
    }

    let nextId = null;
    if (this._answerId) {
      // 대답의 다음 것을 설정해야 함.
      this._historyDialogIds[this._historyDialogIds.length - 1].answerId =
        this._answerId;
      this._curDialogId = this._answerId;
      this._answerId = null;
    }

    const dialogText = this._dialogMap.get(this._curDialogId);
    if (dialogText && !this._isEmptyOrWhitespace(dialogText.NextID)) {
      nextId = dialogText.NextID;
    } else {
      this._curDialogId = null;
    }

    if (nextId) {
      const nextText = this._dialogMap.get(nextId);
      if (nextText) {
        this._curDialogId = nextId;
        this._historyDialogIds.push({ dialogId: this._curDialogId });
      } else {
        this._curDialogId = null;
      }
    }

    this._updateCallback?.(true);
    return this._curDialogId !== null;
  }
  // dialog type에 따라서 분기될 예정. 현재에는 필요없어서 제거
  canGoToPrev(): boolean {
    // return false;
    return this._historyDialogIds.length > 1;
  }
  goToPrev() {
    if (this._historyDialogIds.length > 1) {
      this._historyDialogIds.pop();
      this._curDialogId =
        this._historyDialogIds[this._historyDialogIds.length - 1].dialogId;
      this._answerId = null;
      this._updateCallback?.(true);
    }
  }
  // 기획팀에서 필요없다고 해서 제거
  canSkip(): boolean {
    return false;
    // if (!this._dialogMap || !this._curDialogId) return false;
    // // todo : lastdialogid를 찾아서 거기까지 이동.
    // let lastId = null;
    // this._dialogMap.forEach((value, key) => {
    //     if (value?.TellerType === TELLER_SYSTEM) {
    //         lastId = key;
    //     }
    // });
    // if (!lastId) return false;
    // return (this._curDialogId !== lastId);
  }
  skip() {
    if (!this._dialogMap || !this._curDialogId) return;
    // todo : lastdialogid를 찾아서 거기까지 이동.
    let lastId = null;
    this._dialogMap.forEach((value, key) => {
      if (value?.TellerType === TELLER_SYSTEM) {
        lastId = key;
      }
    });

    if (!lastId) {
      logger.error('skip : lastId is null');
      return;
    }

    if (this._curDialogId === lastId) return;

    //logger.log("lastId", lastId);
    const nextText = this._dialogMap.get(lastId);
    if (nextText) {
      this._curDialogId = lastId;
      this._historyDialogIds.push({ dialogId: this._curDialogId });
    } else {
      this._curDialogId = null;
    }
    this._updateCallback?.(false);
  }
  getTotalScore(): number {
    if (!this._dialogMap) return 0;

    let totalScore = 0;
    for (const info of this._historyDialogIds) {
      let dialogText = this._dialogMap.get(info.dialogId);
      if (dialogText) totalScore += dialogText.AnswerScore;

      if (info.answerId) {
        dialogText = this._dialogMap.get(info.answerId);
        if (dialogText) totalScore += dialogText.AnswerScore;
      }
    }
    return totalScore;
  }
  getProgressRatio(): number {
    return Math.min(1, this.getQuestionIndex() / this._maxQuestionNum);
  }
  getBackgroundImageVideo(): string {
    return this._dialogInfo?.BackGroundImageVideo ?? '';
  }
  //-----------------------------------------------------------------------------------
  // todo : result 관련 함수 구현
  //-----------------------------------------------------------------------------------
  hasResult(): boolean {
    return this._dialogInfo?.ShowResult === true;
  }
  endDialog(): void {
    const resultList = TableDataManager.getInstance().getDialogResultList(
      this._dialogId,
    );
    if (!resultList) return;
    resultList.sort((a, b) => {
      return a.MinScore - b.MinScore;
    });
    const totalScore = this.getTotalScore();
    for (let i = 0; i < resultList.length; ++i) {
      if (
        resultList[i].MinScore <= totalScore &&
        totalScore <= resultList[i].MaxScore
      ) {
        this._dialogResult = resultList[i];
        break;
      }
    }
    console.log(
      'endDialog - totalScore : ',
      totalScore,
      ' this._dialogResult : ',
      this._dialogResult,
    );
  }
  getResultURL(): string | undefined {
    return this._dialogResult?.ResultURL;
  }
  getResultId(): string | undefined {
    return this._dialogResult?.ID;
  }
  getResultImageName(): string | undefined {
    return this._dialogResult?.ResultImageName;
  }
  getResultAnimationItemId(): string | undefined {
    return this._dialogResult?.ResultAnimationItemID;
  }
  getResultSubTitleTextId0(): string | undefined {
    return this._dialogResult?.ResultSubTitle0LocalKey;
  }
  getResultMainTitleTextId0(): string | undefined {
    return this._dialogResult?.ResultMainTitle0LocalKey;
  }
  getResultSubTitleTextId1(): string | undefined {
    return this._dialogResult?.ResultSubTitle1LocalKey;
  }
  getResultMainTitleTextId1(): string | undefined {
    return this._dialogResult?.ResultMainTitle1LocalKey;
  }
  getResultTextId1(): string | undefined {
    return this._dialogResult?.ResultText1LocalKey;
  }
  getResultSubTitleTextId2(): string | undefined {
    return this._dialogResult?.ResultSubTitle2LocalKey;
  }
  getResultMainTitleTextId2(): string | undefined {
    return this._dialogResult?.ResultMainTitle2LocalKey;
  }
  getResultTextId2(): string | undefined {
    return this._dialogResult?.ResultText2LocalKey;
  }

  //-----------------------------------------------------------------------------------
  // private 함수들
  //-----------------------------------------------------------------------------------
  // todo : 차후에는 서버에서 가져올 수도 있음.
  private _loadDialogData() {
    this._dialogInfo = TableDataManager.getInstance().findDialogMain(
      this._dialogId,
    );
    if (!this._dialogInfo) {
      logger.error('_loadDialogData : dialogInfo is null');
    }

    const dialogMap = TableDataManager.getInstance().getDialogList(
      this._dialogId,
    );
    if (dialogMap.size === 0) {
      logger.error('_loadDialogData : dialogMap is null');
    } else {
      logger.log(dialogMap);
    }
    this._dialogMap = dialogMap;
    this._maxQuestionNum = this._calcMaxQuestionNum();
  }
  private _isEmptyOrWhitespace(str: string | undefined): boolean {
    return !str || str.trim().length === 0;
  }
  private _calcMaxQuestionNum(): number {
    let maxNum = 0;
    if (!this._dialogMap || !this._dialogInfo) return maxNum;

    let curDialog = this._dialogMap.get(this._dialogInfo.FirstDialogTextID);
    if (!curDialog) return maxNum;

    while (curDialog) {
      if (curDialog.AnswerID.length > 0) {
        ++maxNum;
        curDialog = this._dialogMap.get(curDialog.AnswerID[0]);
      } else {
        curDialog = this._dialogMap.get(curDialog.NextID);
      }
    }
    return maxNum;
  }
}

export class ReactDialogSystem {
  private _dialogSystem: DialogSystem | null = null;
  private _setUiChangedVersion: any;
  private _showFullText: boolean = false;
  private _setShowFullText: any;

  startDialog(dialogId: string, dialogResultId?: string): boolean {
    if (this._dialogSystem) this._dialogSystem.dispose();

    this._dialogSystem = new DialogSystem(dialogId, dialogResultId);
    this._dialogSystem.setUpdateCallback((resetTextAnim: boolean) => {
      this.updateUi(resetTextAnim);
    });
    // titleButtonTextId 가 있는 경우 titlePage가 있다. return true.
    if (this._dialogSystem.hasTitlePage()) {
      return true;
    }
    return this._dialogSystem.startDialog();
  }

  getDialogSystem(): DialogSystem | null {
    return this._dialogSystem;
  }

  dispose() {
    this._dialogSystem?.dispose();
    this._dialogSystem = null;
  }

  //-----------------------------------------------------------------------------------
  // useState 관련 함수
  //-----------------------------------------------------------------------------------
  use() {
    const [showFullText, setShowFullText] = React.useState<boolean>(false);
    this._showFullText = showFullText;
    this._setShowFullText = setShowFullText;

    const [, /*uiChangedVersion*/ setUiChangedVersion] =
      React.useState<number>(0);
    this._setUiChangedVersion = setUiChangedVersion;
  }

  updateUi(resetTextAnim: boolean) {
    this._setUiChangedVersion?.((v: number) => v + 1);
    if (resetTextAnim) {
      this.showFullText(false);
    }
  }

  isShowingFullText(): boolean {
    return this._showFullText;
  }
  showFullText(show: boolean) {
    this._setShowFullText(show);
  }
}

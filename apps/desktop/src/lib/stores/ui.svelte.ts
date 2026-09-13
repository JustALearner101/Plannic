export type MainViewMode = 'documents' | 'graph' | 'board';

export class UIStore {
  mainView = $state<MainViewMode>('documents');
  searchOpen = $state(false);
  historyCollapsed = $state(false);
  viewMode = $state<'preview' | 'edit'>('preview');
  newPlanModalOpen = $state(false);
  saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');

  setMainView(view: MainViewMode) {
    this.mainView = view;
  }

  cycleMainView() {
    if (this.mainView === 'documents') this.mainView = 'graph';
    else if (this.mainView === 'graph') this.mainView = 'board';
    else this.mainView = 'documents';
  }

  toggleHistory() {
    this.historyCollapsed = !this.historyCollapsed;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'preview' ? 'edit' : 'preview';
  }

  setSaveStatus(status: 'idle' | 'saving' | 'saved') {
    this.saveStatus = status;
  }
}

export const uiStore = new UIStore();

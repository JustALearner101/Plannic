export class UIStore {
  searchOpen = $state(false);
  historyCollapsed = $state(false);
  viewMode = $state<'preview' | 'edit'>('preview');
  newPlanModalOpen = $state(false);
  saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');

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

const createPanel = {
  init() {
    window.addEventListener('load', () => this.nameField.focus());
    document.addEventListener('click', this.handleEvent.bind(this));
    document.addEventListener('submit', this.handleEvent.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  },

  handleEvent(e) {
    e.preventDefault();
    if (e.target.classList.contains('tabmarks-create-panel-cancel')) {
      this.closePanel();
    } else if (e.target.classList.contains('tabmarks-create-panel-create') ||
               e.target.classList.contains('tabmarks-create-panel-form')) {
      this.createGroup();
    }
  },

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.closePanel();
    }
  },

  get nameField() {
    return document.getElementById('group_name');
  },

  closePanel() {
    window.close();
  },

  createGroup() {
    browser.runtime.sendMessage({
      message: 'createGroup',
      groupName: this.nameField.value,
    });
    this.closePanel();
  },
};

createPanel.init();

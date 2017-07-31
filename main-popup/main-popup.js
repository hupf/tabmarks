const mainPopup = {
  init() {
    document.addEventListener('click', this.handleClick.bind(this));
  },

  handleClick(e) {
    if (e.target.closest('.tabmarks-save-as-group')) {
      this.saveAsGroup();
    } else if (e.target.closest('.tabmarks-create-empty-group')) {
      this.createEmptyGroup();
    }
  },

  closePopup() {
    window.close();
  },

  createEmptyGroup() {
    browser.runtime.sendMessage({
      message: 'showCreatePanel',
    });
    this.closePopup();
  },

  saveAsGroup() {
    browser.windows.getCurrent().then((currentWindow) => {
      browser.runtime.sendMessage({
        message: 'showCreatePanel',
        tabsWindowId: currentWindow.id,
      });
      this.closePopup();
    });
  },
};

mainPopup.init();

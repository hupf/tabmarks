const options = {

  rootFolderName: null,

  init() {
    document.addEventListener('click', this.handleEvent.bind(this));
    document.addEventListener('submit', this.handleEvent.bind(this));
    this.port = browser.runtime.connect({ name: 'options' });
    this.port.onMessage.addListener(this.handleMessage.bind(this));
  },

  handleEvent(e) {
    if (e.target.id === 'nameEditButton') {
      this.editName(true);
      this.nameInput.focus();
    } else if (e.target.id === 'nameCancelButton') {
      this.editName(false);
      this.nameInput.value = this.rootFolderName;
    } else if (e.target.id === 'nameForm') {
      e.preventDefault();
      this.saveRootFolderName();
      this.editName(false);
    }
  },

  handleMessage(message) {
    switch (message.message) {
      case 'updateRootFolderName':
        this.updateRootFolderName(message.rootFolderName);
        break;
      default:
        console.error('Received unknown message:', message);
    }
  },

  updateRootFolderName(rootFolderName) {
    this.rootFolderName = rootFolderName;
    this.nameInput.value = rootFolderName;
    this.editName(false);
  },

  saveRootFolderName() {
    const name = this.nameInput.value;
    if (name.trim() === this.rootFolderName) {
      this.nameInput.value = this.rootFolderName;
      return;
    }
    tm.bookmarks.renameRootFolder(name);
  },

  get nameInput() {
    return document.querySelector('#rootFolderName');
  },

  get nameEditButton() {
    return document.querySelector('#nameEditButton');
  },

  get nameCancelButton() {
    return document.querySelector('#nameCancelButton');
  },

  get nameSaveButton() {
    return document.querySelector('#nameSaveButton');
  },

  editName(enabled) {
    this.nameInput.disabled = !enabled;
    this.nameEditButton.style.display = enabled ? 'none' : '';
    this.nameCancelButton.style.display = enabled ? '' : 'none';
    this.nameSaveButton.style.display = enabled ? '' : 'none';
  },

};

options.init();

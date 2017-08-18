const options = {

  rootFolderName: null,

  init() {
    document.addEventListener('click', this.onClick.bind(this));
    document.addEventListener('submit', this.onSubmit.bind(this));

    this.port = browser.runtime.connect({ name: 'options' });
    this.port.onMessage.addListener(this.onMessage.bind(this));
  },

  onClick(e) {
    if (e.target.id === 'nameEditButton') {
      this.editName(true);
      this.nameInput.focus();
    } else if (e.target.id === 'nameCancelButton') {
      this.editName(false);
      this.nameInput.value = this.rootFolderName;
    }
  },

  onSubmit(e) {
    e.preventDefault();

    if (e.target.id === 'nameForm') {
      this.saveRootFolderName();
      this.editName(false);
    }
  },

  onMessage(message) {
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

  editName(enabled) {
    this.nameInput.disabled = !enabled;
    this.nameEditButton.style.display = enabled ? 'none' : '';
    this.nameCancelButton.style.display = enabled ? '' : 'none';
    this.nameSaveButton.style.display = enabled ? '' : 'none';
  },

  get nameInput() {
    return document.getElementById('rootFolderName');
  },

  get nameEditButton() {
    return document.getElementById('nameEditButton');
  },

  get nameCancelButton() {
    return document.getElementById('nameCancelButton');
  },

  get nameSaveButton() {
    return document.getElementById('nameSaveButton');
  },

};

options.init();

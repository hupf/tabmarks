import bookmarksHelper from '../helpers/bookmarks';
import importHelper from '../helpers/import';

export default {

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
    } else if (e.target.id === 'importMessageButton') {
      this.showImportContent();
    }
  },

  onSubmit(e) {
    e.preventDefault();

    if (e.target.id === 'nameForm') {
      this.saveRootFolderName();
      this.editName(false);
    } else if (e.target.id === 'importForm') {
      this.import();
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
    bookmarksHelper.renameRootFolder(name);
  },

  editName(enabled) {
    this.nameInput.disabled = !enabled;
    this.nameEditButton.style.display = enabled ? 'none' : '';
    this.nameCancelButton.style.display = enabled ? '' : 'none';
    this.nameSaveButton.style.display = enabled ? '' : 'none';
  },

  import() {
    this.showImportProgress();
    importHelper.importTabGroupsJson(this.importField.value)
      .then(() => {
        this.importField.value = '';
        this.showImportMessage('Import finished.');
        this.port.postMessage({ message: 'refreshGroups' });
      }, (error) => {
        this.showImportMessage(`An error occurred: ${error}`);
      });
  },

  showImportContent() {
    this.importContent.style.display = '';
    this.importProgress.style.display = 'none';
    this.importMessage.style.display = 'none';
  },

  showImportProgress() {
    this.importContent.style.display = 'none';
    this.importProgress.style.display = '';
    this.importMessage.style.display = 'none';
  },

  showImportMessage(message) {
    this.importContent.style.display = 'none';
    this.importProgress.style.display = 'none';
    this.importMessage.querySelector('.text').textContent = message;
    this.importMessage.style.display = '';
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

  get importButton() {
    return document.getElementById('importButton');
  },

  get importField() {
    return document.getElementById('importField');
  },

  get importContent() {
    return document.getElementById('importContent');
  },

  get importProgress() {
    return document.getElementById('importProgress');
  },

  get importMessage() {
    return document.getElementById('importMessage');
  },

};

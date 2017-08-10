const main = {

  defaultPopupPort: null,
  optionsPort: null,

  init() {
    browser.runtime.onConnect.addListener(this.handleConnect.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

    browser.windows.onCreated.addListener(w => this.initWindow(w.id));

    this.initWindows()
      .then(() => this.loadGroups());
  },

  handleConnect(port) {
    port.onMessage.addListener(this.handleMessage.bind(this));
    switch (port.name) {
      case 'defaultPopup':
        this.defaultPopupPort = port;
        this.updateDefaultPopupSelectedGroup();
        this.updateDefaultPopupGroupList();
        break;
      case 'options':
        this.optionsPort = port;
        this.updateOptionsRootFolderName();
        break;
      default:
        break;
    }
    port.onDisconnect.addListener(this.handleDisconnect.bind(this));
  },

  handleDisconnect(port) {
    if (port.name === 'defaultPopup') {
      this.defaultPopupPort = null;
    }
  },

  handleMessage(message) {
    switch (message.message) {
      case 'createGroup':
        this.createGroup(message.windowId, message.groupName, message.saveTabs);
        break;
      case 'selectGroup':
        this.selectGroup(message.windowId, message.groupId);
        break;
      default:
        console.error('Received unknown message:', message);
    }
  },

  initWindows() {
    return browser.windows.getAll()
      .then(windows => windows.map(w => w.id))
      .then(windowIds => Promise.all(windowIds.map(windowId =>
        this.initWindow(windowId))));
  },

  initWindow(windowId) {
    return Promise.all([tm.groups.getSelectedGroupId(windowId),
      tm.tabs.getNonEmptyOfWindow(windowId)])
        .then(([groupId, tabs]) => {
          if (tabs.length === 0) {
            // Browser opens new tab on startup
            return this.selectGroup(windowId, groupId);
          }
          // Browser is set up to open tabs from last session
          return this.updateSelectedGroup(windowId, groupId);
        });
  },

  loadGroups() {
    return tm.groups.getAll().then((groups) => {
      if (groups) {
        this.groups = groups;
        this.updateDefaultPopupGroupList();
      }
    });
  },

  createGroup(windowId, name, saveTabs) {
    tm.bookmarks.createFolder(name).then((folder) => {
      let promise;
      if (saveTabs) {
        // Create group from currently open tabs
        promise = tm.bookmarks.saveTabsOfWindow(windowId, folder);
      } else {
        // Create empty group with new tab (and close currently open tabs)
        promise = tm.tabs.openEmptyGroup(windowId);
      }
      promise.then(() => this.updateSelectedGroup(windowId, folder.id));

      this.loadGroups();
    });
  },

  selectGroup(windowId, groupId = null) {
    if (!groupId) {
      tm.tabs.openEmptyGroup(windowId)
        .then(() => this.updateSelectedGroup(windowId, null));
      return;
    }

    tm.tabs.openGroup(windowId, groupId)
      .then(() => this.updateSelectedGroup(windowId, groupId));
  },

  updateSelectedGroup(windowId, groupId) {
    tm.groups.saveSelectedGroupId(windowId, groupId);
    tm.ui.updateWindowBrowserActions(windowId, groupId);
  },

  updateDefaultPopupSelectedGroup() {
    if (!this.defaultPopupPort) return;

    browser.windows.getCurrent().then(w => w.id)
      .then(windowId => tm.groups.getSelectedGroupId(windowId))
      .then((groupId) => {
        this.defaultPopupPort.postMessage({
          message: 'updateSelectedGroup',
          groupId,
        });
      });
  },


  updateDefaultPopupGroupList() {
    if (!this.defaultPopupPort) return;

    this.defaultPopupPort.postMessage({ message: 'updateGroupList', groups: this.groups });
  },

  updateOptionsRootFolderName() {
    if (!this.optionsPort) return;

    tm.bookmarks.getRootFolderName().then(rootFolderName =>
      this.optionsPort.postMessage({ message: 'updateRootFolderName', rootFolderName }));
  },

};

main.init();

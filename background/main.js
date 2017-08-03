const main = {

  defaultPopupPort: null,
  optionsPort: null,

  init() {
    browser.runtime.onConnect.addListener(this.handleConnect.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

    browser.windows.onCreated.addListener(w => this.onWindowCreated(w.id));

    this.loadGroups();
  },

  handleConnect(port) {
    port.onMessage.addListener(this.handleMessage.bind(this));
    switch (port.name) {
      case 'defaultPopup':
        this.defaultPopupPort = port;
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
        this.createGroup(message.windowId, message.groupName);
        break;
      case 'selectGroup':
        this.selectGroup(message.windowId, message.groupId);
        break;
      default:
        console.error('Received unknown message:', message);
    }
  },

  onWindowCreated(windowId) {
    tm.groups.getSelectedGroupId(windowId)
      .then(groupId => groupId && this.selectGroup(windowId, groupId));
  },

  loadGroups() {
    return tm.groups.getAll().then((groups) => {
      if (groups) {
        this.groups = groups;
        this.updateDefaultPopupGroupList();
      }
    });
  },

  createGroup(windowId, name) {
    tm.bookmarks.createFolder(name).then((folder) => {
      // Create empty group with new tab (and close currently open tabs)
      tm.tabs.openEmptyGroup(windowId)
        .then(() => this.updateSelectedGroup(windowId, folder.id));

      // TODO: if no group is selected (i.e. new window), allow to create a group from
      // the currently open tabs (requires second option in main popup)

      this.loadGroups();
    });
  },

  selectGroup(windowId, groupId = null) {
    if (!groupId) {
      this.updateSelectedGroup(windowId, null);
      return;
    }

    tm.tabs.openGroup(windowId, groupId)
      .then(() => this.updateSelectedGroup(windowId, groupId));
  },

  updateSelectedGroup(windowId, groupId) {
    tm.groups.saveSelectedGroupId(windowId, groupId);
    tm.ui.updateWindowBrowserActions(windowId, groupId);
  },

  updateDefaultPopupGroupList() {
    if (this.defaultPopupPort) {
      this.defaultPopupPort.postMessage({ message: 'updateGroupList', groups: this.groups });
    }
  },

  updateOptionsRootFolderName() {
    if (this.optionsPort) {
      tm.bookmarks.getRootFolderName().then(rootFolderName =>
        this.optionsPort.postMessage({ message: 'updateRootFolderName', rootFolderName }));
    }
  },

};

main.init();

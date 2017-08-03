const main = {

  mainPopupPort: null,
  optionsPort: null,
  createGroupWindowId: null,

  init() {
    browser.runtime.onConnect.addListener(this.handleConnect.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

    browser.windows.onCreated.addListener(w => this.onWindowCreated(w.id));
    // browser.windows.onRemoved.addListener(this.onWindowRemoved.bind(this));

    this.loadGroups();
  },

  handleConnect(port) {
    port.onMessage.addListener(this.handleMessage.bind(this));
    switch (port.name) {
      case 'mainPopup':
        this.mainPopupPort = port;
        this.updateMainPopupGroupList();
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
    if (port.name === 'mainPopup') {
      this.mainPopupPort = null;
    }
  },

  handleMessage(message) {
    switch (message.message) {
      case 'showCreatePanel':
        this.createGroupWindowId = message.windowId;
        this.showCreatePanel();
        break;
      case 'createGroup':
        this.createGroup(this.createGroupWindowId, message.groupName);
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
      .then(groupId => this.selectGroup(windowId, groupId));
  },

  // onWindowRemoved(windowId) {
  //   tm.groups.saveSelectedGroupId(windowId, null);
  // },

  loadGroups() {
    return tm.groups.getAll().then((groups) => {
      if (groups) {
        this.groups = groups;
        this.updateMainPopupGroupList();
      }
    });
  },

  showCreatePanel() {
    return browser.windows.create({
      type: 'panel',
      url: browser.extension.getURL('create-panel/create-panel.html'),
      width: 500,
      height: 97,
    });
  },

  createGroup(windowId, name) {
    tm.bookmarks.createFolder(name).then((folder) => {
      // Create empty group with new tab (and close currently open tabs)
      tm.tabs.openEmptyGroup(windowId);

      // TODO: if no group is selected (first-time user), allow to create a group from
      // the currently open tabs (requires second option in main popup)

      this.updateSelectedGroup(windowId, folder.id);
      this.loadGroups();
    });
  },

  selectGroup(windowId, groupId) {
    if (!groupId) {
      this.updateSelectedGroup(windowId, null);
      return;
    }

    this.updateSelectedGroup(windowId, groupId).then(() =>
      tm.tabs.openGroup(windowId, groupId));
  },

  updateSelectedGroup(windowId, groupId) {
    return tm.groups.saveSelectedGroupId(windowId, groupId).then(() =>
      tm.ui.updateWindowBrowserActions(windowId, groupId));
  },

  updateMainPopupGroupList() {
    if (this.mainPopupPort) {
      this.mainPopupPort.postMessage({ message: 'updateGroupList', groups: this.groups });
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

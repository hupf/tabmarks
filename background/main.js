const main = {

  mainPopupPort: null,
  selectedGroupId: null,
  tabsWindowId: null,

  init() {
    browser.runtime.onConnect.addListener(this.handleConnect.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    this.loadSelectedGroupId();
    this.loadGroups();
  },

  handleConnect(port) {
    port.onMessage.addListener(this.handleMessage.bind(this));
    if (port.name === 'mainPopup') {
      this.mainPopupPort = port;
      this.updateMainPopupGroupList();
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
        this.showCreatePanel(message.tabsWindowId);
        break;
      case 'createGroup':
        this.createGroup(message.groupName);
        break;
      case 'selectGroup':
        this.selectGroup(message.groupId);
        break;
      default:
        console.error('Received unknown message:', message);
    }
  },

  getRootFolder() {
    // TODO: make configurable
    return browser.bookmarks.search({ title: 'Other Bookmarks' })
      .then(result => result && result.length && result[0]);
  },

  loadSelectedGroupId() {
    browser.storage.local.get('selectedGroupId')
      .then((result) => {
        this.selectGroup(result.selectedGroupId);
      });
  },

  saveSelectedGroupId() {
    browser.storage.local.set({ selectedGroupId: this.selectedGroupId });
  },

  loadGroups() {
    return this.getRootFolder()
      .then(rootFolder => rootFolder && browser.bookmarks.getChildren(rootFolder.id))
      .then((groupFolders) => {
        if (groupFolders) {
          this.groups = groupFolders
            .filter(f => !f.url)
            .map(f => ({ id: f.id, name: f.title }));
          this.updateMainPopupGroupList();
          return this.groups;
        }
        return null;
      });
  },

  showCreatePanel(tabsWindowId) {
    this.tabsWindowId = tabsWindowId;
    return browser.windows.create({
      type: 'panel',
      url: browser.extension.getURL('create-panel/create-panel.html'),
      width: 500,
      height: 97,
    });
  },

  createGroup(name) {
    // TODO: confirm if non-persisted tabs should be closed
    tm.bookmarks.createFolder(name)
      .then((folder) => {
        if (this.tabsWindowId) {
          return tm.bookmarks.saveTabs(folder, this.tabsWindowId)
            .then(() => folder);
          // TODO: open new tab & close open bookmarks if creating empty group
        }
        return folder;
      })
      .then(folder => this.updateSelectedGroup(folder))
      .then(() => this.loadGroups());
  },

  selectGroup(groupId) {
    if (!groupId) {
      this.updateSelectedGroup(null);
      return;
    }

    // TODO: confirm if non-persisted tabs should be closed
    Promise.all([tm.bookmarks.getFolder(groupId), tm.tabs.getCurrentWindowId()])
      .then(([folder, windowId]) => {
        this.updateSelectedGroup(folder);
        if (folder) {
          tm.tabs.openOfGroup(windowId, folder.id);
        }
      });
  },

  updateSelectedGroup(folder) {
    this.selectedGroupId = folder ? folder.id : null;
    this.saveSelectedGroupId();

    browser.browserAction.setTitle({ title: folder ? `Tabmarks (${folder.title})` : 'Tabmarks' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#666' });
    browser.browserAction.setBadgeText({
      text: folder ? folder.title : '',
    });
  },

  updateMainPopupGroupList() {
    if (this.mainPopupPort) {
      this.mainPopupPort.postMessage({ message: 'updateGroupList', groups: this.groups });
    }
  },

};

main.init();

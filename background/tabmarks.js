const tabmarks = {
  mainPopupPort: null,
  selectedGroupFolderId: null,
  tabsWindowId: null,

  init() {
    browser.runtime.onConnect.addListener(this.handleConnect.bind(this));
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    // browser.tabs.onUpdated.addListener(updateActiveTab);
    // browser.tabs.onActivated.addListener(updateActiveTab);
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
      default:
        console.error('Received unknown message:', message);
    }
  },

  getRootFolder() {
    // TODO: make configurable
    return browser.bookmarks.search({ title: 'Other Bookmarks' })
      .then(result => result && result.length && result[0]);
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
    this.createBookmarkFolder(name)
      .then((folder) => {
        if (this.tabsWindowId) {
          this.createTabBookmarks(folder, this.tabsWindowId);
        }
        this.updateSelectedGroupFolder(folder);
        return folder;
      });
  },

  updateSelectedGroupFolder(folder) {
    this.selectedGroupFolderId = folder ? folder.id : null;
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


  // Tabs functions

  getTabs(windowId) {
    return new Promise((resolve) => {
      browser.tabs.query({ windowId, pinned: false }, resolve);
    });
  },


  // Bookmarks functions

  createBookmarkFolder(name) {
    return browser.bookmarks.create({ title: name });
  },

  createTabBookmarks(folder, windowId) {
    this.getTabs(windowId).then((tabs) => {
      tabs.forEach((tab) => {
        browser.bookmarks.create({
          parentId: folder.id,
          title: tab.title,
          url: tab.url,
        });
      });
    });
  },
};

tabmarks.init();

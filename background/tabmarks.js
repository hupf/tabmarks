const tabmarks = {
  selectedGroupFolderId: null,
  tabsWindowId: null,

  init() {
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));
    // browser.tabs.onUpdated.addListener(updateActiveTab);
    // browser.tabs.onActivated.addListener(updateActiveTab);
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

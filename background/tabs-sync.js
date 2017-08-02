const tabsSync = {

  init() {
    browser.tabs.onAttached.addListener(this.onAttached.bind(this));
    browser.tabs.onDetached.addListener(this.onDetached.bind(this));
    // browser.tabs.onCreated.addListener(this.onCreated.bind(this));
    browser.tabs.onMoved.addListener(this.onMoved.bind(this));
    browser.tabs.onRemoved.addListener(this.onRemoved.bind(this));
    browser.tabs.onUpdated.addListener(this.onUpdated.bind(this));
    // browser.tabs.onReplaced.addListener(this.onReplaced.bind(this));
  },

  onAttached(tabId, attachInfo) {
    console.log('onAttached', tabId, attachInfo);
  },

  onDetached(tabId, detachInfo) {
    console.log('onDetached', tabId, detachInfo);
  },

  // onCreated(tab) {
  //   console.log('onCreated', tab);
  // },

  onMoved(tabId, moveInfo) {
    tm.bookmarks.moveInSelectedGroup(moveInfo.fromIndex, moveInfo.toIndex);
  },

  onRemoved(tabId, removeInfo) {
    tm.groups.getSelectedGroupFolder().then(folder =>
      tm.bookmarks.emptyFolder(folder.id)
        .then(() => tm.bookmarks.saveTabs(folder, removeInfo.windowId)));
  },

  onUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      Promise.all([tm.tabs.getOfCurrentWindow(), tm.bookmarks.getOfSelectedGroup()])
        .then(([tabs, bookmarks]) => {
          if (tabs.length > bookmarks.length) {
            tm.bookmarks.createInSelectedGroup(tab);
          } else {
            tm.bookmarks.updateInSelectedGroup(tab);
          }
        });
    }
  },

  // onReplaced(addedTabId, removedTabId) {
  //   console.log('onReplaced', addedTabId, removedTabId);
  // },

};

tabsSync.init();

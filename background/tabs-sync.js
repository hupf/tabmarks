const tabsSync = {

  init() {
    browser.tabs.onAttached.addListener(this.onAttached.bind(this));
    browser.tabs.onDetached.addListener(this.onDetached.bind(this));
    // browser.tabs.onCreated.addListener(this.onCreated.bind(this));
    browser.tabs.onMoved.addListener(this.onMoved.bind(this));
    browser.tabs.onRemoved.addListener(this.onRemoved.bind(this));
    browser.tabs.onUpdated.addListener(this.onUpdated.bind(this));
    browser.tabs.onReplaced.addListener(this.onReplaced.bind(this));
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
    console.log('onMoved', tabId, moveInfo);
  },

  onRemoved(tabId, removeInfo) {
    console.log('onRemoved', tabId, removeInfo);
  },

  onUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      Promise.all([tm.tabs.getOfCurrentWindow(), tm.bookmarks.getOfSelectedGroup()])
        .then(([tabs, bookmarks]) => {
          if (tabs.length > bookmarks.length) {
            tm.bookmarks.createInSelectedGroupFromTab(tab);
          } else {
            tm.bookmarks.updateInSelectedGroupFromTab(tab);
          }
        });
    }
  },

  onReplaced(addedTabId, removedTabId) {
    console.log('onReplaced', addedTabId, removedTabId);
  },

};

tabsSync.init();

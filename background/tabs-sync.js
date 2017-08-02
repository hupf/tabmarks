if (!window.tm) window.tm = {};

tm.tabsSync = {
  disabled: false,

  init() {
    browser.tabs.onAttached.addListener(this.onAttached.bind(this));
    browser.tabs.onDetached.addListener(this.onDetached.bind(this));
    browser.tabs.onCreated.addListener(this.onCreated.bind(this));
    browser.tabs.onMoved.addListener(this.onMoved.bind(this));
    browser.tabs.onRemoved.addListener(this.onRemoved.bind(this));
    browser.tabs.onUpdated.addListener(this.onUpdated.bind(this));
    // browser.tabs.onReplaced.addListener(this.onReplaced.bind(this));
  },

  onAttached(tabId, attachInfo) {
    if (this.disabled) return;

    tm.groups.getSelectedGroupId(attachInfo.newWindowId).then((groupId) => {
      if (!groupId) return;

      tm.tabs.get(tabId).then(tab => tm.bookmarks.createFromTab(tab, attachInfo.newPosition));
      // TODO: update browserAction
    });
  },

  onDetached(tabId, detachInfo) {
    if (this.disabled) return;

    tm.groups.getSelectedGroupId(detachInfo.oldWindowId).then((groupId) => {
      if (!groupId) return;

      tm.bookmarks.removeAtIndex(groupId, detachInfo.oldPosition);
      // TODO: update browserAction
    });
  },

  onCreated(tab) {
    if (this.disabled) return;

    tm.ui.updateTabBrowserActionByWindowId(tab);
  },

  onMoved(tabId, moveInfo) {
    if (this.disabled) return;

    tm.bookmarks.moveInSelectedGroup(moveInfo.windowId, moveInfo.fromIndex, moveInfo.toIndex);
  },

  onRemoved(tabId, removeInfo) {
    if (this.disabled) return;

    tm.groups.getSelectedGroupFolder(removeInfo.windowId).then(folder =>
      folder && tm.bookmarks.emptyFolder(folder.id)
        .then(() => tm.bookmarks.saveTabsOfWindow(removeInfo.windowId, folder)));
  },

  onUpdated(tabId, changeInfo, tab) {
    if (this.disabled) return;

    // TODO: what about pinned tabs?
    if (Object.prototype.hasOwnProperty.call(changeInfo, 'status') && changeInfo.status === 'complete') {
      tm.groups.getSelectedGroupId(tab.windowId).then((groupId) => {
        if (!groupId) return;

        Promise.all([tm.tabs.getOfWindow(tab.windowId), tm.bookmarks.getOfWindow(tab.windowId)])
          .then(([tabs, bookmarks]) => this.createOrUpdate(tab, tabs, bookmarks));
      });
    }
  },

  // onReplaced(addedTabId, removedTabId) {
  //   if (this.disabled) return;
  //
  //   console.log('onReplaced', addedTabId, removedTabId);
  // },

  createOrUpdate(tab, tabs, bookmarks) {
    if (bookmarks != null) {
      if (tabs.length > bookmarks.length) {
        tm.bookmarks.createFromTab(tab);
      } else {
        tm.bookmarks.updateFromTab(tab);
      }
    }
  },

};

tm.tabsSync.init();

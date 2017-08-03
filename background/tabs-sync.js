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
  },

  onAttached(tabId, attachInfo) {
    if (this.disabled) return;

    tm.groups.getSelectedGroupId(attachInfo.newWindowId).then((groupId) => {
      if (!groupId) return;

      tm.tabs.transformIndex(attachInfo.newPosition, attachInfo.newWindowId)
        .then(newPosition =>
          tm.tabs.get(tabId).then(tab => tm.bookmarks.createFromTab(tab, newPosition)));
      // TODO: update tab's browserAction
    });
  },

  onDetached(tabId, detachInfo) {
    if (this.disabled) return;

    tm.groups.getSelectedGroupId(detachInfo.oldWindowId).then((groupId) => {
      if (!groupId) return;

      tm.tabs.transformIndex(detachInfo.oldPosition, detachInfo.oldWindowId)
        .then(oldPosition => tm.bookmarks.removeAtIndex(groupId, oldPosition));
      // TODO: update tab's browserAction
    });
  },

  onCreated(tab) {
    if (this.disabled) return;

    tm.ui.updateTabBrowserActionByWindowId(tab);
  },

  onMoved(tabId, moveInfo) {
    if (this.disabled) return;

    tm.tabs.transformIndex([moveInfo.fromIndex, moveInfo.toIndex], moveInfo.windowId)
      .then(([fromIndex, toIndex]) =>
        tm.bookmarks.moveInSelectedGroup(moveInfo.windowId, fromIndex, toIndex));
  },

  onRemoved(tabId, removeInfo) {
    if (this.disabled || removeInfo.isWindowClosing) return;

    this.replaceAll(removeInfo.windowId, tabId);
  },

  onUpdated(tabId, changeInfo, tab) {
    if (this.disabled) return;

    if (Object.prototype.hasOwnProperty.call(changeInfo, 'status') && changeInfo.status === 'complete') {
      this.onComplete(tab);
    } else if (Object.prototype.hasOwnProperty.call(changeInfo, 'pinned')) {
      this.onPinnedChange(tab);
    }
  },

  onComplete(tab) {
    if (tab.status !== 'complete') return;

    tm.groups.getSelectedGroupId(tab.windowId).then((groupId) => {
      if (!groupId) return;

      Promise.all([tm.tabs.getOfWindow(tab.windowId), tm.bookmarks.getOfWindow(tab.windowId)])
        .then(([tabs, bookmarks]) => this.createOrUpdate(tab, tabs, bookmarks));
    });
  },

  onPinnedChange(tab) {
    tm.groups.getSelectedGroupId(tab.windowId).then((groupId) => {
      if (!groupId) return;

      if (tab.pinned) {
        this.replaceAll(tab.windowId, tab.id);
      } else {
        tm.tabs.transformIndex(tab.index, tab.windowId)
          .then(index => tm.bookmarks.createFromTab(tab, index));
      }
    });
  },

  createOrUpdate(tab, tabs, bookmarks) {
    if (bookmarks == null) return;

    tm.tabs.transformIndex(tab.index, tab.windowId)
      .then((index) => {
        if (tabs.length > bookmarks.length) {
          tm.bookmarks.createFromTab(tab, index);
        } else {
          tm.bookmarks.updateFromTab(tab, index);
        }
      });
  },

  replaceAll(windowId, excludeTabId) {
    tm.groups.getSelectedGroupFolder(windowId)
      .then((folder) => {
        if (!folder) return;

        tm.bookmarks.replaceWithTabsOfWindow(windowId, folder, excludeTabId);
      });
  },

};

tm.tabsSync.init();

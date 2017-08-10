if (!window.tm) window.tm = {};

tm.tabs = {

  get(tabId) {
    return browser.tabs.get(tabId);
  },

  getOfWindow(windowId, filter = { pinned: false }) {
    return new Promise((resolve) => {
      browser.tabs.query(Object.assign({ windowId }, filter), resolve);
    });
  },

  getNonEmptyOfWindow(windowId) {
    return this.getOfWindow(windowId)
      .then(tabs => tabs.filter(t => t.url !== 'about:newtab' && t.url !== 'about:blank'));
  },

  transformIndex(indexOrIndices, windowId) {
    // The tab.index contains pinned tabs, exclude them to be able to compare with bookmark indices
    return this.getOfWindow(windowId, { pinned: true })
      .then(pinnedTabs => pinnedTabs.length)
      .then((offset) => {
        if (Array.isArray(indexOrIndices)) {
          return indexOrIndices.map(i => i - offset);
        }
        return indexOrIndices - offset;
      });
  },

  openGroup(windowId, groupId) {
    return this.getOfWindow(windowId)
      .then(tabs => tabs.map(t => t.id))
      .then(previousTabIds =>
        tm.bookmarks.getChildren(groupId)
          .then((bookmarks) => {
            this.disableSync();
            if (bookmarks.length === 0) {
              // For empty groups, make sure at least one tab is open,
              // to not accidentially close the window
              return this.open(null, true);
            }
            return Promise.all(bookmarks.map((bookmark, i) => this.open(bookmark, i === 0)));
          })
          .then(() => this.close(previousTabIds))
          .then(this.enableSync, this.enableSync));
  },

  openEmptyGroup(windowId) {
    return this.getOfWindow(windowId)
      .then(tabs => tabs.map(t => t.id))
      .then((previousTabIds) => {
        this.disableSync();
        return this.open(null, true)
          .then(() => this.close(previousTabIds))
          .then(this.enableSync, this.enableSync);
      });
  },

  open(bookmark, active) {
    return browser.tabs.create({
      url: bookmark ? bookmark.url : 'about:blank',
      active,
    });
  },

  close(tabIds) {
    return browser.tabs.remove(tabIds);
  },

  disableSync() {
    tm.tabsSync.disabled = true;
  },

  enableSync(value) {
    setTimeout(() => {
      tm.tabsSync.disabled = false;
    });
    return value;
  },

};

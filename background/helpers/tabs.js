if (!window.tm) window.tm = {};

tm.tabs = {

  getCurrentWindowId() {
    return browser.windows.getCurrent().then(currentWindow => currentWindow.id);
  },

  getOfWindow(windowId) {
    return new Promise((resolve) => {
      browser.tabs.query({ windowId, pinned: false }, resolve);
    });
  },

  openOfGroup(windowId, groupId) {
    return this.getOfWindow(windowId)
      .then(tabs => tabs.map(t => t.id))
      .then(previousTabIds =>
        tm.bookmarks.getChildren(groupId)
          .then((bookmarks) => {
            if (bookmarks.length === 0) {
              // For empty groups, make sure at least one tab is open,
              // to not accidentially close the window
              return this.open(null, true);
            }
            return Promise.all(bookmarks.map((bookmark, i) => this.open(bookmark, i === 0)));
          })
          .then(() => this.close(previousTabIds)));
  },

  open(bookmark, active) {
    return browser.tabs.create({
      url: bookmark && bookmark.url,
      active,
    });
  },

  close(tabIds) {
    return browser.tabs.remove(tabIds);
  },

};

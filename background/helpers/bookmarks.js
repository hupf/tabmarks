if (!window.tm) window.tm = {};

tm.bookmarks = {

  getRootFolder() {
    // TODO: make configurable
    return browser.bookmarks.search({ title: 'Other Bookmarks' })
      .then(result => result && result.length && result[0]);
  },

  getFolder(folderId) {
    if (!folderId) {
      return Promise.resolve(null);
    }

    return browser.bookmarks.get(folderId)
      .then((result) => {
        if (result && result.length) {
          return result[0];
        }
        return null;
      }, () => null);
  },

  getChildren(folderId) {
    return browser.bookmarks.getChildren(folderId);
  },

  getOfWindow(windowId) {
    return tm.groups.getSelectedGroupId(windowId)
      .then((groupId) => {
        if (groupId) {
          return this.getChildren(groupId);
        }
        return null;
      });
  },

  createFolder(name) {
    return this.getRootFolder()
      .then(root => root.id)
      .then(parentId => browser.bookmarks.create({
        parentId,
        title: name,
      }));
  },

  emptyFolder(folderId) {
    return this.getChildren(folderId)
      .then(children => Promise.all(children.map(c => browser.bookmarks.remove(c.id))));
  },

  createFromTab(tab) {
    return tm.groups.getSelectedGroupId(tab.windowId)
      .then(parentId =>
        browser.bookmarks.create({
          parentId,
          title: tab.title,
          url: tab.url,
          index: tab.index,
        }));
  },

  updateFromTab(tab) {
    return this.getOfWindow(tab.windowId)
      .then(bookmarks => bookmarks[tab.index])
      .then(bookmark => browser.bookmarks.update(bookmark.id, {
        title: tab.title,
        url: tab.url,
      }));
  },

  moveInSelectedGroup(windowId, fromIndex, toIndex) {
    return tm.groups.getSelectedGroupId(windowId)
      .then(parentId =>
        parentId && this.getChildren(parentId)
          .then(bookmarks => bookmarks[fromIndex])
          .then(bookmark => browser.bookmarks.move(bookmark.id, { parentId, index: toIndex })));
  },

  saveTabsOfWindow(windowId, folder) {
    return tm.tabs.getNonEmptyOfWindow(windowId)
      .then(tabs => Promise.all(tabs.map(tab =>
        browser.bookmarks.create({
          parentId: folder.id,
          title: tab.title,
          url: tab.url,
        }))));
  },

};

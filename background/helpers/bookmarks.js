if (!window.tm) window.tm = {};

tm.bookmarks = {

  getRootFolder() {
    // TODO: make configurable
    return browser.bookmarks.search({ title: 'Other Bookmarks' })
      .then(result => result && result.length && result[0]);
  },

  getFolder(folderId) {
    return browser.bookmarks.get(folderId)
      .then((result) => {
        if (result && result.length) {
          return result[0];
        }
        return null;
      });
  },

  getChildren(folderId) {
    return browser.bookmarks.getChildren(folderId);
  },

  getOfSelectedGroup() {
    return tm.groups.getSelectedGroupId()
      .then(groupId => this.getChildren(groupId));
  },

  createFolder(name) {
    return browser.bookmarks.create({ title: name });
  },

  emptyFolder(folderId) {
    return this.getChildren(folderId)
      .then(children => Promise.all(children.map(c => browser.bookmarks.remove(c.id))));
  },

  createInSelectedGroup(tab) {
    return tm.groups.getSelectedGroupId().then(parentId =>
      browser.bookmarks.create({
        parentId,
        title: tab.title,
        url: tab.url,
        index: tab.index,
      }));
  },

  updateInSelectedGroup(tab) {
    return this.getOfSelectedGroup()
      .then(bookmarks => bookmarks[tab.index])
      .then(bookmark => browser.bookmarks.update(bookmark.id, {
        title: tab.title,
        url: tab.url,
      }));
  },

  moveInSelectedGroup(fromIndex, toIndex) {
    return tm.groups.getSelectedGroupId()
      .then(parentId =>
        this.getChildren(parentId)
          .then(bookmarks => bookmarks[fromIndex])
          .then(bookmark => browser.bookmarks.move(bookmark.id, { parentId, index: toIndex })));
  },

  saveTabs(folder, windowId) {
    return tm.tabs.getOfWindow(windowId)
      .then(tabs => tabs.filter(t => t.url !== 'about:newtab' && t.url !== 'about:blank'))
      .then(tabs => Promise.all(tabs.map(tab =>
        browser.bookmarks.create({
          parentId: folder.id,
          title: tab.title,
          url: tab.url,
        }))));
  },

};

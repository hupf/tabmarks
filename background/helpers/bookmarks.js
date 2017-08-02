if (!window.tm) window.tm = {};

tm.bookmarks = {

  getRootFolder() {
    // TODO: make configurable
    return browser.bookmarks.search({ title: 'Other Bookmarks' })
      .then(result => result && result.length && result[0]);
  },

  createFolder(name) {
    return browser.bookmarks.create({ title: name });
  },

  createInSelectedGroupFromTab(tab) {
    return tm.groups.getSelectedGroupId().then(parentId =>
      browser.bookmarks.create({
        parentId,
        title: tab.title,
        url: tab.url,
        index: tab.index,
      }));
  },

  updateInSelectedGroupFromTab(tab) {
    return tm.groups.getSelectedGroupId()
      .then(parentId => this.getChildren(parentId))
      .then(bookmarks => bookmarks[tab.index])
      .then(bookmark => browser.bookmarks.update(bookmark.id, {
        title: tab.title,
        url: tab.url,
      }));
  },

  saveTabs(folder, windowId) {
    return tm.tabs.getOfWindow(windowId)
      .then(tabs => tabs.filter(t => t.url !== 'about:newtab'))
      .then(tabs => Promise.all(tabs.map(tab =>
        browser.bookmarks.create({
          parentId: folder.id,
          title: tab.title,
          url: tab.url,
        }))));
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

};

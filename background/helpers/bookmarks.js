if (!window.tm) window.tm = {};

tm.bookmarks = {

  createFolder(name) {
    return browser.bookmarks.create({ title: name });
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

};

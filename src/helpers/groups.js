import bookmarksHelper from './bookmarks';

export default {
  selectedGroupIds: null,

  getAll() {
    return bookmarksHelper.getRootFolder()
      .then(rootFolder => rootFolder && browser.bookmarks.getChildren(rootFolder.id))
      .then((groupFolders) => {
        if (groupFolders) {
          return groupFolders
            .filter(f => !f.url)
            .map(f => ({ id: f.id, name: f.title }));
        }
        return null;
      });
  },

  getSelectedGroupId(windowId) {
    return this.getSelectedGroupIds()
      .then(groupIds => Object.prototype.hasOwnProperty.call(groupIds, windowId) &&
            groupIds[windowId]);
  },

  saveSelectedGroupId(windowId, groupId) {
    return this.getSelectedGroupIds().then((groupIds) => {
      this.selectedGroupIds = Object.assign({}, groupIds);
      this.selectedGroupIds[windowId] = groupId;
      return browser.storage.local.set({ selectedGroupIds: this.selectedGroupIds });
    });
  },

  getSelectedGroupIds() {
    if (this.selectedGroupIds) {
      return Promise.resolve(this.selectedGroupIds);
    }
    return browser.storage.local.get('selectedGroupIds')
      .then((result) => {
        this.selectedGroupIds = result.selectedGroupIds;
        return result.selectedGroupIds || {};
      });
  },

  getSelectedGroupFolder(windowId) {
    return this.getSelectedGroupId(windowId)
      .then(groupId => bookmarksHelper.getFolder(groupId));
  },

  // TODO: test & use instead of OnWindowRemoved after browser start
  cleanupSelectedGroupIds() {
    Promise.all([
      browser.windows.getAll({ windowTypes: ['normal'] }),
      this.getSelectedGroupIds(),
    ]).then(([windows, groupIds]) => {
      const selectedGroupIds = Object.assign({}, groupIds);
      const usedWindowIds = windows.map(w => w.id);
      const storedWindowIds = Object.keys(groupIds);

      storedWindowIds.forEach((id) => {
        if (!usedWindowIds.contains(id)) {
          delete selectedGroupIds[id];
        }
      });

      return browser.storage.local.set({ selectedGroupIds });
    });
  },

};

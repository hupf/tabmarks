if (!window.tm) window.tm = {};

tm.groups = {
  selectedGroupIds: null,

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
      .then(groupId => tm.bookmarks.getFolder(groupId));
  },

  getAll() {
    return tm.bookmarks.getRootFolder()
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

};

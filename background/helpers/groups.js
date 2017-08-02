if (!window.tm) window.tm = {};

tm.groups = {
  selectedGroupId: null,

  getSelectedGroupId() {
    if (this.selectedGroupId) {
      return Promise.resolve(this.selectedGroupId);
    }
    return browser.storage.local.get('selectedGroupId')
      .then(result => result.selectedGroupId);
  },

  saveSelectedGroupId(groupId) {
    this.selectedGroupId = groupId;
    return browser.storage.local.set({ selectedGroupId: groupId });
  },

  getSelectedGroupFolder() {
    return this.getSelectedGroupId().then(groupId => tm.bookmarks.getFolder(groupId));
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

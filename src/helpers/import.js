import bookmarksHelper from './bookmarks';

export default {

  importTabGroupsJson(json, errorCallback) {
    let data;
    try {
      data = JSON.parse(json);
      if (Array.isArray(data.windows)) {
        return data.windows.reduce((result, windowData) =>
          result.then(() => this.importWindows(windowData, errorCallback)),
        Promise.resolve());
      }
      return Promise.reject('Invalid JSON structure');
    } catch (e) {
      return Promise.reject('Unable to parse JSON', e);
    }
  },

  importWindows(data, errorCallback) {
    const groups = this.getGroupsData(data);
    const tabs = this.getTabsData(data);

    if (groups) {
      groups.forEach((group, i) => {
        groups[i].tabs = tabs.filter(t => t.groupId === group.id);
      });
      return this.importGroups(groups, errorCallback);
    }

    return Promise.resolve();
  },

  importGroups(groups, errorCallback) {
    return groups.reduce((result, group) =>
      result.then(() => bookmarksHelper.createFolder(group.title)
        .then(folder => this.importTabs(group.tabs, folder, errorCallback)))
        .catch((error) => {
          if (errorCallback) {
            errorCallback({ type: 'folder', name: group.title, error });
          }
        }),
      Promise.resolve());
  },

  importTabs(tabs, folder, errorCallback) {
    return tabs.reduce((result, tab) =>
      result.then(() => bookmarksHelper.create(tab.title, tab.url, folder.id))
        .catch((error) => {
          if (errorCallback) {
            errorCallback({ type: 'bookmark', name: tab.url, error });
          }
        }),
    Promise.resolve());
  },

  getGroupsData(data) {
    if (data && data.extData && data.extData['tabview-group']) {
      try {
        const groups = JSON.parse(data.extData['tabview-group']);
        return Object.keys(groups).map(id => ({ id: parseInt(id, 10), title: groups[id].title }));
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  getTabsData(data) {
    if (Array.isArray(data.tabs)) {
      return data.tabs
        .map(this.getTabData)
        .filter(t => t && t.url && t.url.indexOf('about:') !== 0);
    }
    return [];
  },

  getTabData(data) {
    if (Array.isArray(data.entries) && data.entries.length > 0) {
      const entry = data.entries[0];
      if (data && data.extData && data.extData['tabview-tab']) {
        try {
          const groupData = JSON.parse(data.extData['tabview-tab']);
          if (groupData && groupData.groupID != null) {
            return {
              title: entry.title,
              url: entry.url,
              groupId: parseInt(groupData.groupID, 10),
            };
          }
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  },

};

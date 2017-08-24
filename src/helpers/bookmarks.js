import groupsHelper from './groups';
import tabsHelper from './tabs';

const DEFAULT_ROOT_FOLDER_NAME = 'Tabmarks Groups';

export default {
  rootFolderName: null,

  getRootFolderName() {
    if (this.rootFolderName) {
      return Promise.resolve(this.rootFolderName);
    }

    return browser.storage.local.get('rootFolderName')
      .then(result => result.rootFolderName)
      .then((rootFolderName) => {
        if (!rootFolderName) {
          this.rootFolderName = DEFAULT_ROOT_FOLDER_NAME;
          return browser.storage.local.set({ rootFolderName: DEFAULT_ROOT_FOLDER_NAME })
            .then(() => DEFAULT_ROOT_FOLDER_NAME);
        }
        this.rootFolderName = rootFolderName;
        return rootFolderName;
      });
  },

  renameRootFolder(name) {
    return this.getRootFolder()
      .then(folder => browser.bookmarks.update(folder.id, { title: name }))
      .then((folder) => {
        this.rootFolderName = name;
        browser.storage.local.set({ rootFolderName: name });
        return folder;
      });
  },

  getRootFolder() {
    return this.getRootFolderName().then(rootFolderName =>
      browser.bookmarks.search({ title: rootFolderName })
        .then((result) => {
          if (result && result.length) {
            return result[0];
          }
          return browser.bookmarks.create({ title: rootFolderName });
        }));
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
    return groupsHelper.getSelectedGroupId(windowId)
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

  create(name, url, parentId) {
    return browser.bookmarks.create({
      parentId,
      title: name,
      url,
    });
  },

  createFromTab(tab, index) {
    return groupsHelper.getSelectedGroupId(tab.windowId)
      .then(parentId =>
        browser.bookmarks.create({
          parentId,
          title: tab.title,
          url: tab.url,
          index,
        }));
  },

  updateFromTab(tab, index) {
    return this.getOfWindow(tab.windowId)
      .then(bookmarks => bookmarks[index])
      .then(bookmark => browser.bookmarks.update(bookmark.id, {
        title: tab.title,
        url: tab.url,
      }));
  },

  removeAtIndex(folderId, index) {
    return this.getChildren(folderId)
      .then(children => children[index].id)
      .then(childId => browser.bookmarks.remove(childId));
  },

  moveInSelectedGroup(windowId, fromIndex, toIndex) {
    if (fromIndex == null || toIndex == null) return Promise.resolve(false);
    return groupsHelper.getSelectedGroupId(windowId)
      .then(parentId =>
        parentId && this.getChildren(parentId)
          .then(bookmarks => bookmarks[fromIndex])
          .then(bookmark => browser.bookmarks.move(bookmark.id, { parentId, index: toIndex })));
  },

  saveTabsOfWindow(windowId, folder, excludeTabId = null) {
    return tabsHelper.getRelevantOfWindow(windowId)
      .then(tabs => tabs.filter(t => t.id !== excludeTabId))
      // Save bookmarks on-by-one due to problems with index
      .then(tabs => tabs.reduce((result, tab, index) =>
        result.then(() => browser.bookmarks.create({
          parentId: folder.id,
          title: tab.title,
          url: tab.url,
          index,
        })), Promise.resolve()));
  },

  replaceWithTabsOfWindow(windowId, folder, excludeTabId) {
    return this.emptyFolder(folder.id)
      .then(() => this.saveTabsOfWindow(windowId, folder, excludeTabId));
  },

};

if (!window.tm) window.tm = {};

tm.ui = {

  updateWindowBrowserActions(windowId, groupId) {
    Promise.all([tm.bookmarks.getFolder(groupId), tm.tabs.getOfWindow(windowId, {})])
      .then(([folder, tabs]) =>
        tabs.forEach(tab => this.updateTabBrowserActionForFolder(tab, folder)));
  },

  updateTabBrowserAction(tab) {
    tm.groups.getSelectedGroupFolder(tab.windowId)
      .then(folder => this.updateTabBrowserActionForFolder(tab, folder));
  },

  updateTabBrowserActionForFolder(tab, folder) {
    browser.browserAction.setBadgeBackgroundColor({ color: '#666' });
    browser.browserAction.setTitle({
      title: folder ? `Tabmarks (${folder.title})` : 'Tabmarks',
      tabId: tab.id,
    });
    browser.browserAction.setBadgeText({
      text: folder ? folder.title : '',
      tabId: tab.id,
    });
  },

};

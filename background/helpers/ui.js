if (!window.tm) window.tm = {};

tm.ui = {

  updateWindowBrowserActions(windowId, groupId) {
    Promise.all([tm.bookmarks.getFolder(groupId), tm.tabs.getOfWindow(windowId)])
      .then(([folder, tabs]) =>
        // TODO: get all tabs, including pinned
        tabs.forEach(tab => this.updateTabBrowserAction(tab, folder)));
  },

  updateTabBrowserAction(tab, folder) {
    browser.browserAction.setBadgeBackgroundColor({ color: '#666' });
    browser.browserAction.setTitle({
      title: folder ? `Tabmarks (${folder.title})` : 'Tabmarks',
      // tabId: tab.id, // TODO: does somehow not work, FF bug?
    });
    browser.browserAction.setBadgeText({
      text: folder ? folder.title : '',
      // tabId: tab.id, // TODO: does somehow not work, FF bug?
    });
  },

  updateTabBrowserActionByWindowId(tab) {
    tm.groups.getSelectedGroupFolder(tab.windowId)
      .then(folder => this.updateTabBrowserAction(tab, folder));
  },

};

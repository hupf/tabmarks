import bookmarksHelper from './bookmarks';
import groupsHelper from './groups';
import tabsHelper from './tabs';

export default {

  updateWindowBrowserActions(windowId, groupId) {
    Promise.all([bookmarksHelper.getFolder(groupId), tabsHelper.getOfWindow(windowId, {})])
      .then(([folder, tabs]) =>
        tabs.forEach(tab => this.updateTabBrowserActionForFolder(tab, folder)));
  },

  updateTabBrowserAction(tab) {
    groupsHelper.getSelectedGroupFolder(tab.windowId)
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

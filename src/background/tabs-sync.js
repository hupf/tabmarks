import bookmarksHelper from '../helpers/bookmarks';
import groupsHelper from '../helpers/groups';
import tabsHelper from '../helpers/tabs';
import uiHelper from '../helpers/ui';

export default {
  disabled: false,

  init() {
    browser.tabs.onAttached.addListener(this.onAttached.bind(this));
    browser.tabs.onDetached.addListener(this.onDetached.bind(this));
    browser.tabs.onCreated.addListener(this.onCreated.bind(this));
    browser.tabs.onMoved.addListener(this.onMoved.bind(this));
    browser.tabs.onRemoved.addListener(this.onRemoved.bind(this));
    browser.tabs.onUpdated.addListener(this.onUpdated.bind(this));
  },

  onAttached(tabId, attachInfo) {
    if (this.disabled) return;

    groupsHelper.getSelectedGroupId(attachInfo.newWindowId).then((groupId) => {
      if (!groupId) return;

      tabsHelper.transformIndex(attachInfo.newPosition, attachInfo.newWindowId)
        .then(newPosition => tabsHelper.get(tabId).then((tab) => {
          bookmarksHelper.createFromTab(tab, newPosition);
          uiHelper.updateTabBrowserAction(tab);
        }));
    });
  },

  onDetached(tabId, detachInfo) {
    if (this.disabled) return;

    groupsHelper.getSelectedGroupId(detachInfo.oldWindowId).then((groupId) => {
      if (!groupId) return;

      tabsHelper.transformIndex(detachInfo.oldPosition, detachInfo.oldWindowId)
        .then(oldPosition => bookmarksHelper.removeAtIndex(groupId, oldPosition));
    });
  },

  onCreated(tab) {
    if (this.disabled) return;

    uiHelper.updateTabBrowserAction(tab);
  },

  onMoved(tabId, moveInfo) {
    if (this.disabled) return;

    tabsHelper.transformIndex([moveInfo.fromIndex, moveInfo.toIndex], moveInfo.windowId)
      .then(([fromIndex, toIndex]) =>
        bookmarksHelper.moveInSelectedGroup(moveInfo.windowId, fromIndex, toIndex));
  },

  onRemoved(tabId, removeInfo) {
    if (this.disabled || removeInfo.isWindowClosing) return;

    this.replaceAll(removeInfo.windowId, tabId);
  },

  onUpdated(tabId, changeInfo, tab) {
    if (this.disabled) return;

    if (Object.prototype.hasOwnProperty.call(changeInfo, 'status') && changeInfo.status === 'complete') {
      this.onComplete(tab);
    } else if (Object.prototype.hasOwnProperty.call(changeInfo, 'pinned')) {
      this.onPinnedChange(tab);
    }
  },

  onComplete(tab) {
    if (tab.status !== 'complete' || tab.url.indexOf('about:') === 0) return;

    groupsHelper.getSelectedGroupId(tab.windowId).then((groupId) => {
      if (!groupId) return;

      Promise.all([tabsHelper.getRelevantOfWindow(tab.windowId),
        bookmarksHelper.getOfWindow(tab.windowId)])
        .then(([tabs, bookmarks]) => this.createOrUpdate(tab, tabs, bookmarks));
    });
  },

  onPinnedChange(tab) {
    groupsHelper.getSelectedGroupId(tab.windowId).then((groupId) => {
      if (!groupId) return;

      if (tab.pinned) {
        this.replaceAll(tab.windowId, tab.id);
      } else {
        tabsHelper.transformIndex(tab.index, tab.windowId)
          .then(index => bookmarksHelper.createFromTab(tab, index));
      }
    });
  },

  createOrUpdate(tab, tabs, bookmarks) {
    if (bookmarks == null) return;

    tabsHelper.transformIndex(tab.index, tab.windowId)
      .then((index) => {
        if (tabs.length > bookmarks.length) {
          bookmarksHelper.createFromTab(tab, index);
        } else if (!this.equals(tab, bookmarks[index])) {
          bookmarksHelper.updateFromTab(tab, index);
        }
      });
  },

  replaceAll(windowId, excludeTabId) {
    groupsHelper.getSelectedGroupFolder(windowId)
      .then((folder) => {
        if (!folder) return;

        bookmarksHelper.replaceWithTabsOfWindow(windowId, folder, excludeTabId);
      });
  },

  equals(tab, bookmark) {
    return tab.title === bookmark.title && tab.url === bookmark.url;
  },

};

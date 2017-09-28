import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/concatMap';

import bookmarksHelper from '../helpers/bookmarks';
import groupsHelper from '../helpers/groups';
import tabsHelper from '../helpers/tabs';
import uiHelper from '../helpers/ui';

export default {
  disabled: false,

  init() {
    // TODO: two update events fire between detach/attach, how to make sure
    // attach is no creatin another bookmark? Workaround: ignore onAttached
    // this.bindAttached();
    this.bindDetached();
    this.bindCreated();
    this.bindMoved();
    this.bindRemoved();
    this.bindUpdated();
  },

  bindAttached() {
    const attached$ = new Subject();
    browser.tabs.onAttached.addListener((tabId, attachInfo) => {
      attached$.next({ tabId, attachInfo });
    });
    attached$
      .filter(() => !this.disabled)
      .concatMap(event => this.onAttached(event.tabId, event.attachInfo))
      .subscribe();
  },

  onAttached(tabId, attachInfo) {
    return groupsHelper.getSelectedGroupId(attachInfo.newWindowId).then((groupId) => {
      if (!groupId) return false;

      return tabsHelper.transformIndex(attachInfo.newPosition, attachInfo.newWindowId)
        .then(newPosition => tabsHelper.get(tabId).then(tab => Promise.all([
          bookmarksHelper.createFromTab(tab, newPosition),
          uiHelper.updateTabBrowserAction(tab),
        ])));
    });
  },

  bindDetached() {
    const detached$ = new Subject();
    browser.tabs.onDetached.addListener((tabId, detachInfo) => {
      detached$.next({ tabId, detachInfo });
    });
    detached$
      .filter(() => !this.disabled)
      .concatMap(event => this.onDetached(event.tabId, event.detachInfo))
      .subscribe();
  },

  onDetached(tabId, detachInfo) {
    return groupsHelper.getSelectedGroupId(detachInfo.oldWindowId).then((groupId) => {
      if (!groupId) return false;

      return tabsHelper.transformIndex(detachInfo.oldPosition, detachInfo.oldWindowId)
        .then(oldPosition => bookmarksHelper.removeAtIndex(groupId, oldPosition));
    });
  },

  bindCreated() {
    const created$ = new Subject();
    browser.tabs.onCreated.addListener((tab) => {
      created$.next({ tab });
    });
    created$
      .filter(() => !this.disabled)
      .concatMap(event => this.onCreated(event.tab))
      .subscribe();
  },

  onCreated(tab) {
    return uiHelper.updateTabBrowserAction(tab);
  },

  bindMoved() {
    const moved$ = new Subject();
    browser.tabs.onMoved.addListener((tabId, moveInfo) => {
      moved$.next({ tabId, moveInfo });
    });
    moved$
      .filter(() => !this.disabled)
      .concatMap(event => this.onMoved(event.tabId, event.moveInfo))
      .subscribe();
  },

  onMoved(tabId, moveInfo) {
    return tabsHelper.transformIndex([moveInfo.fromIndex, moveInfo.toIndex], moveInfo.windowId)
      .then(([fromIndex, toIndex]) =>
        bookmarksHelper.moveInSelectedGroup(moveInfo.windowId, fromIndex, toIndex));
  },

  bindRemoved() {
    const removed$ = new Subject();
    browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
      removed$.next({ tabId, removeInfo });
    });
    removed$
      .filter((tabId, removeInfo) => !this.disabled && !removeInfo.isWindowClosing)
      .concatMap(event => this.onRemoved(event.tabId, event.removeInfo))
      .subscribe();
  },

  onRemoved(tabId, removeInfo) {
    return this.replaceAll(removeInfo.windowId, tabId);
  },

  bindUpdated() {
    const updated$ = new Subject();
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      updated$.next({ tabId, changeInfo, tab });
    });
    updated$
      .filter(() => !this.disabled)
      .concatMap(event => this.onUpdated(event.tabId, event.changeInfo, event.tab))
      .subscribe();
  },

  onUpdated(tabId, changeInfo, tab) {
    if (Object.prototype.hasOwnProperty.call(changeInfo, 'url') ||
        Object.prototype.hasOwnProperty.call(changeInfo, 'title')) {
      return this.onUrlChange(tab);
    } else if (Object.prototype.hasOwnProperty.call(changeInfo, 'pinned')) {
      return this.onPinnedChange(tab);
    }
    return Promise.resolve();
  },

  onUrlChange(tab) {
    if (tab.url && tab.url.indexOf('about:') === 0) return Promise.resolve();

    return groupsHelper.getSelectedGroupId(tab.windowId).then((groupId) => {
      if (!groupId) return false;

      return Promise.all([tabsHelper.getRelevantOfWindow(tab.windowId),
        bookmarksHelper.getOfWindow(tab.windowId)])
        .then(([tabs, bookmarks]) => this.createOrUpdate(tab, tabs, bookmarks));
    });
  },

  onPinnedChange(tab) {
    return groupsHelper.getSelectedGroupId(tab.windowId).then((groupId) => {
      if (!groupId) return false;

      if (tab.pinned) {
        return this.replaceAll(tab.windowId, tab.id);
      }
      return tabsHelper.transformIndex(tab.index, tab.windowId)
        .then(index => bookmarksHelper.createFromTab(tab, index));
    });
  },

  createOrUpdate(tab, tabs, bookmarks) {
    if (bookmarks == null) return Promise.resolve();

    return tabsHelper.transformIndex(tab.index, tab.windowId)
      .then((index) => {
        if (tabs.length > bookmarks.length) {
          return bookmarksHelper.createFromTab(tab, index);
        } else if (!this.equals(tab, bookmarks[index])) {
          return bookmarksHelper.updateFromTab(tab, index);
        }
        return false;
      });
  },

  replaceAll(windowId, excludeTabId) {
    return groupsHelper.getSelectedGroupFolder(windowId)
      .then((folder) => {
        if (!folder) return false;

        return bookmarksHelper.replaceWithTabsOfWindow(windowId, folder, excludeTabId);
      });
  },

  equals(tab, bookmark) {
    return tab.title === bookmark.title && tab.url === bookmark.url;
  },

};

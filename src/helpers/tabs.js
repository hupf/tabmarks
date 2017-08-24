import bookmarksHelper from './bookmarks';
import tabsSync from '../background/tabs-sync';

export default {

  get(tabId) {
    return browser.tabs.get(tabId);
  },

  getOfWindow(windowId, filter = { pinned: false }) {
    return new Promise((resolve) => {
      browser.tabs.query(Object.assign({ windowId }, filter), resolve);
    });
  },

  getRelevantOfWindow(windowId) {
    return this.getOfWindow(windowId).then(tabs => tabs.filter(t => t.url.indexOf('about:') !== 0));
  },

  transformIndex(indexOrIndices, windowId) {
    // The tab.index contains pinned and priviledged tabs,
    // exclude them to be able to compare with bookmark indices
    return this.getOfWindow(windowId, {})
      .then(tabs => tabs.filter(t => t.pinned || t.url.indexOf('about:') === 0))
      .then(ignoredTabs => ignoredTabs.map(t => t.index))
      .then((ignoredIndices) => {
        if (Array.isArray(indexOrIndices)) {
          return indexOrIndices.map(i => this.adjustIndexForIgnored(i, ignoredIndices));
        }
        return this.adjustIndexForIgnored(indexOrIndices, ignoredIndices);
      });
  },

  adjustIndexForIgnored(index, ignoredIndices) {
    if (ignoredIndices.includes(index)) return null;
    let offset = ignoredIndices.findIndex(i => i > index);
    if (offset === -1) {
      offset = ignoredIndices.length;
    }
    return index - offset;
  },

  openGroup(windowId, groupId) {
    return this.getOfWindow(windowId)
      .then(tabs => tabs.map(t => t.id))
      .then(previousTabIds =>
        bookmarksHelper.getChildren(groupId)
          .then(bookmarks => this.withTabSyncDisabled(() => {
            let promise;
            if (bookmarks.length === 0) {
              // For empty groups, make sure at least one tab is open,
              // to not accidentially close the window
              promise = this.open(null, true);
            }
            promise = Promise.all(bookmarks.map((bookmark, i) => this.open(bookmark, i === 0)));
            return promise.then(() => this.close(previousTabIds), () => this.close(previousTabIds));
          })));
  },

  openEmptyGroup(windowId) {
    return this.getOfWindow(windowId)
      .then(tabs => tabs.map(t => t.id))
      .then(previousTabIds => this.withTabSyncDisabled(() =>
        this.open(null, true)
          .then(() => this.close(previousTabIds))));
  },

  open(bookmark, active) {
    return browser.tabs.create({
      url: bookmark ? bookmark.url : 'about:blank',
      active,
    });
  },

  close(tabIds) {
    return browser.tabs.remove(tabIds);
  },

  withTabSyncDisabled(promiseCallback) {
    tabsSync.disabled = true;
    return promiseCallback().then(
      (result) => {
        setTimeout(() => {
          tabsSync.disabled = false;
        });
        return result;
      },
      (error) => {
        setTimeout(() => {
          tabsSync.disabled = false;
        });
        return Promise.reject(error);
      });
  },

};

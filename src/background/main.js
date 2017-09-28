import bookmarksHelper from '../helpers/bookmarks';
import groupsHelper from '../helpers/groups';
import tabsHelper from '../helpers/tabs';
import uiHelper from '../helpers/ui';

export default {

  defaultPopupPort: null,
  optionsPort: null,

  init() {
    browser.runtime.onConnect.addListener(this.onConnect.bind(this));
    browser.runtime.onMessage.addListener(this.onMessage.bind(this));

    browser.windows.onCreated.addListener(w => this.initWindow(w.id));

    this.initWindows()
      .then(() => this.loadGroups());
  },

  onConnect(port) {
    port.onMessage.addListener(this.onMessage.bind(this));
    switch (port.name) {
      case 'defaultPopup':
        this.defaultPopupPort = port;
        this.updateDefaultPopupSelectedGroup();
        this.updateDefaultPopupGroupList();
        break;
      case 'options':
        this.optionsPort = port;
        this.updateOptionsRootFolderName();
        break;
      default:
        break;
    }
    port.onDisconnect.addListener(this.onDisconnect.bind(this));
  },

  onDisconnect(port) {
    if (port.name === 'defaultPopup') {
      this.defaultPopupPort = null;
    }
  },

  onMessage(message) {
    switch (message.message) {
      case 'createGroup':
        this.createGroup(message.windowId, message.groupName, message.saveTabs);
        break;
      case 'selectGroup':
        this.selectGroup(message.windowId, message.groupId);
        break;
      case 'refreshGroups':
        this.loadGroups();
        break;
      default:
        // Unknown message
    }
  },

  initWindows() {
    return browser.windows.getAll()
      .then(windows => windows.map(w => w.id))
      .then(windowIds => Promise.all(windowIds.map(windowId =>
        this.initWindow(windowId))));
  },

  initWindow(windowId) {
    return Promise.all([groupsHelper.getSelectedGroupId(windowId),
      tabsHelper.getRelevantOfWindow(windowId)])
      .then(([groupId, tabs]) => {
        if (tabs.length === 0) {
          // Browser opens new tab on startup
          return this.selectGroup(windowId, groupId);
        }
        // Browser is set up to open tabs from last session
        return this.updateSelectedGroup(windowId, groupId);
      });
  },

  loadGroups() {
    return groupsHelper.getAll().then((groups) => {
      if (groups) {
        this.groups = groups;
        this.updateDefaultPopupGroupList();
      }
    });
  },

  createGroup(windowId, name, saveTabs) {
    bookmarksHelper.createFolder(name).then((folder) => {
      let promise;
      if (saveTabs) {
        // Create group from currently open tabs
        promise = bookmarksHelper.saveTabsOfWindow(windowId, folder);
      } else {
        // Create empty group with new tab (and close currently open tabs)
        promise = tabsHelper.openEmptyGroup(windowId);
      }
      promise.then(() => this.updateSelectedGroup(windowId, folder.id));

      this.loadGroups();
    });
  },

  selectGroup(windowId, groupId = null) {
    if (!groupId) {
      tabsHelper.openEmptyGroup(windowId)
        .then(() => this.updateSelectedGroup(windowId, null));
      return;
    }

    tabsHelper.openGroup(windowId, groupId)
      .then(() => this.updateSelectedGroup(windowId, groupId));
  },

  updateSelectedGroup(windowId, groupId) {
    groupsHelper.saveSelectedGroupId(windowId, groupId);
    uiHelper.updateWindowBrowserActions(windowId, groupId);
  },

  updateDefaultPopupSelectedGroup() {
    if (!this.defaultPopupPort) return;

    browser.windows.getCurrent().then(w => w.id)
      .then(windowId => groupsHelper.getSelectedGroupId(windowId))
      .then((groupId) => {
        this.defaultPopupPort.postMessage({
          message: 'updateSelectedGroup',
          groupId,
        });
      });
  },


  updateDefaultPopupGroupList() {
    if (!this.defaultPopupPort) return;

    this.defaultPopupPort.postMessage({ message: 'updateGroupList', groups: this.groups });
  },

  updateOptionsRootFolderName() {
    if (!this.optionsPort) return;

    bookmarksHelper.getRootFolderName().then(rootFolderName =>
      this.optionsPort.postMessage({ message: 'updateRootFolderName', rootFolderName }));
  },

};

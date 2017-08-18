const defaultPopup = {

  port: null,
  selectedGroupId: null,
  saveTabs: null,

  init() {
    document.addEventListener('click', this.onClick.bind(this));
    document.addEventListener('submit', this.onSubmit.bind(this));

    this.port = browser.runtime.connect({ name: 'defaultPopup' });
    this.port.onMessage.addListener(this.onMessage.bind(this));
  },

  onClick(e) {
    if (e.target.closest('.tabmarks-close-group-link')) {
      this.selectGroup(null);
    } else if (e.target.closest('.tabmarks-create-from-tabs-link')) {
      this.showCreateForm(true);
    } else if (e.target.closest('.tabmarks-create-empty-link')) {
      this.showCreateForm();
    } else if (e.target.closest('.tabmarks-preferences-link')) {
      this.showPreferences();
    } else if (e.target.closest('.tabmarks-group-item')) {
      const groupId = e.target.closest('.tabmarks-group-item').dataset.groupId;
      this.selectGroup(groupId);
    } else if (e.target.classList.contains('tabmarks-create-form-cancel')) {
      this.closePopup();
    } else if (e.target.classList.contains('tabmarks-create-form-create')) {
      this.createGroup();
    }
  },

  onSubmit(e) {
    e.preventDefault();
    if (e.target.classList.contains('tabmarks-create-form')) {
      this.createGroup();
    }
  },

  onMessage(message) {
    switch (message.message) {
      case 'updateSelectedGroup':
        this.updateSelectedGroup(message.groupId);
        break;
      case 'updateGroupList':
        this.updateGroupList(message.groups);
        break;
      default:
        console.error('Received unknown message:', message);
    }
  },

  closePopup() {
    window.close();
  },

  showPreferences() {
    browser.runtime.openOptionsPage();
    this.closePopup();
  },

  showCreateForm(saveTabs = false) {
    this.saveTabs = saveTabs;
    this.createEmptyWarningNode.style.display = saveTabs || this.selectedGroupId ? 'none' : '';

    this.defaultPopupNode.style.display = 'none';
    this.createFormNode.style.display = '';

    this.nameInput.value = '';
    this.nameInput.focus();
  },

  createGroup() {
    this.getCurrentWindowId().then((windowId) => {
      browser.runtime.sendMessage({
        message: 'createGroup',
        windowId,
        groupName: this.nameInput.value,
        saveTabs: this.saveTabs,
      });
      this.closePopup();
    });
  },

  selectGroup(groupId) {
    if (groupId === this.selectedGroupId) return;

    this.getCurrentWindowId().then((windowId) => {
      this.port.postMessage({
        message: 'selectGroup',
        windowId,
        groupId,
      });
      this.closePopup();
    });
  },

  updateSelectedGroup(groupId) {
    this.selectedGroupId = groupId;

    this.closeGroupLink.style.display = groupId ? '' : 'none';
    this.createFromTabsLink.style.display = groupId ? 'none' : '';
    this.disableSelectedGroup();
  },

  updateGroupList(groups) {
    const groupList = document.querySelector('#group-list');
    while (groupList.firstChild) { groupList.removeChild(groupList.firstChild); }

    if (!groups || groups.length === 0) {
      groupList.appendChild(this.renderGroup('No groups available', undefined, true));
    } else {
      groups.map(g => this.renderGroup(g.name, g.id))
        .forEach(i => groupList.appendChild(i));
    }
  },

  renderGroup(name, groupId, disabled) {
    const t = document.querySelector('#group');
    const item = t.content.querySelectorAll('.panel-list-item');
    item[0].dataset.groupId = groupId;
    item[0].classList[disabled && !item[0].classList.contains('disabled') ? 'add' : 'remove']('disabled');
    const text = t.content.querySelectorAll('.text');
    text[0].textContent = name;
    return document.importNode(t.content, true);
  },

  disableSelectedGroup() {
    this.groupNodes.forEach(n => n.classList.remove('disabled'));

    if (this.selectedGroupId && this.activeGroupNode) {
      this.activeGroupNode.classList.add('disabled');
    }
  },

  getCurrentWindowId() {
    return browser.windows.getCurrent().then(w => w.id);
  },

  get groupNodes() {
    return document.querySelectorAll('.tabmarks-group-item');
  },

  get activeGroupNode() {
    if (!this.selectedGroupId) return null;

    return document.querySelector(`.tabmarks-group-item[data-group-id="${this.selectedGroupId}"]`);
  },

  get closeGroupLink() {
    return document.querySelector('.tabmarks-close-group-link');
  },

  get createFromTabsLink() {
    return document.querySelector('.tabmarks-create-from-tabs-link');
  },

  get defaultPopupNode() {
    return document.querySelector('.tabmarks-default-popup');
  },

  get createFormNode() {
    return document.querySelector('.tabmarks-create-form');
  },

  get nameInput() {
    return document.querySelector('.tabmarks-create-form-group-name');
  },

  get createEmptyWarningNode() {
    return document.querySelector('.tabmarks-create-empty-warning');
  },

};

defaultPopup.init();

const defaultPopup = {
  port: null,

  init() {
    document.addEventListener('click', this.handleEvent.bind(this));
    document.addEventListener('submit', this.handleEvent.bind(this));
    this.port = browser.runtime.connect({ name: 'defaultPopup' });
    this.port.onMessage.addListener(this.handleMessage.bind(this));
  },

  handleEvent(e) {
    if (e.target.closest('.tabmarks-show-create-form')) {
      this.showCreateForm();
    } else if (e.target.closest('.tabmarks-group-item')) {
      const groupId = e.target.closest('.tabmarks-group-item').dataset.groupId;
      this.selectGroup(groupId);
    } else if (e.target.classList.contains('tabmarks-create-form-cancel')) {
      this.closePopup();
    } else if (e.target.classList.contains('tabmarks-create-form-create') ||
               e.target.classList.contains('tabmarks-create-form')) {
      e.preventDefault();
      this.createGroup();
    }
  },

  handleMessage(message) {
    switch (message.message) {
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

  get defaultPopup() {
    return document.querySelector('.tabmarks-default-popup');
  },

  get createForm() {
    return document.querySelector('.tabmarks-create-form');
  },

  get nameField() {
    return document.getElementById('groupName');
  },

  showCreateForm() {
    this.defaultPopup.style.display = 'none';
    this.createForm.style.display = '';
    this.nameField.value = '';
    this.nameField.focus();
  },

  createGroup() {
    this.getCurrentWindowId().then((windowId) => {
      browser.runtime.sendMessage({
        message: 'createGroup',
        groupName: this.nameField.value,
        windowId,
      });
      this.closePopup();
    });
  },

  selectGroup(groupId) {
    this.getCurrentWindowId().then((windowId) => {
      this.port.postMessage({
        message: 'selectGroup',
        windowId,
        groupId,
      });
      this.closePopup();
    });
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

  getCurrentWindowId() {
    return browser.windows.getCurrent().then(w => w.id);
  },
};

defaultPopup.init();

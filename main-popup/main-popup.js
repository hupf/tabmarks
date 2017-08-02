const mainPopup = {
  port: null,

  init() {
    document.addEventListener('click', this.handleClick.bind(this));
    this.port = browser.runtime.connect({ name: 'mainPopup' });
    this.port.onMessage.addListener(this.handleMessage.bind(this));
  },

  handleClick(e) {
    if (e.target.closest('.tabmarks-create-group')) {
      this.createGroup();
    } else if (e.target.closest('.tabmarks-group-item')) {
      const groupId = e.target.closest('.tabmarks-group-item').dataset.groupId;
      this.selectGroup(groupId);
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

  createGroup() {
    this.getCurrentWindowId().then((windowId) => {
      this.port.postMessage({
        message: 'showCreatePanel',
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

mainPopup.init();

require('./import.js');

const json = '{"version":["tabGroups",1],"session":{"lastUpdate":1503346557406,"startTime":1503346353157,"recentCrashes":0},"windows":[{"tabs":[{"entries":[{"url":"about:addons","title":"Add-ons Manager","charset":"","ID":2,"persist":true}],"lastAccessed":1503346438393,"hidden":false,"attributes":{},"extData":{"tabview-tab":"{\\"groupID\\":1}"},"index":1,"image":"chrome://mozapps/skin/extensions/extensionGeneric-16.png"},{"entries":[{"url":"https://developer.mozilla.org/en-US/","title":"MDN Web Docs","charset":"UTF-8","ID":1,"persist":true}],"lastAccessed":1503346449124,"hidden":false,"attributes":{},"extData":{"tabview-tab":"{\\"groupID\\":1}"},"index":1,"image":"https://developer.cdn.mozilla.net/static/img/favicon32.e1ca6d9bb933.png"},{"entries":[{"url":"https://www.mozilla.org/en-US/firefox/?utm_medium=referral&utm_source=getfirefox-com","title":"A better, faster, private browser for today | Firefox","charset":"UTF-8","ID":1,"persist":true}],"lastAccessed":1503346523593,"hidden":false,"attributes":{},"extData":{"tabview-tab":"{\\"groupID\\":1}"},"index":1,"image":"https://www.mozilla.org/media/img/firefox/favicon.dc6635050bf5.ico"},{"entries":[{"url":"https://github.com/","title":"The world\'s leading software development platform · GitHub","charset":"UTF-8","ID":1,"persist":true}],"lastAccessed":1503346521778,"hidden":true,"attributes":{},"extData":{"tabview-tab":"{\\"groupID\\":3,\\"active\\":true}"},"index":1,"image":"https://assets-cdn.github.com/favicon.ico"},{"entries":[{"url":"about:tabgroups#session","title":"Tab Groups Options","charset":"","ID":9,"persist":true}],"lastAccessed":1503346557405,"hidden":false,"attributes":{},"extData":{"tabview-tab":"{\\"groupID\\":1}"},"index":1}],"extData":{"tabview-group":"{\\"1\\":{\\"bounds\\":{\\"left\\":15,\\"top\\":5,\\"width\\":1237.285,\\"height\\":658.996},\\"slot\\":1,\\"userSize\\":null,\\"stackTabs\\":true,\\"showThumbs\\":true,\\"showUrls\\":true,\\"tileIcons\\":true,\\"catchOnce\\":true,\\"catchRules\\":\\"\\",\\"title\\":\\"Group A\\",\\"id\\":1},\\"3\\":{\\"bounds\\":{\\"left\\":20,\\"top\\":20,\\"width\\":250,\\"height\\":200},\\"slot\\":2,\\"userSize\\":null,\\"stackTabs\\":true,\\"showThumbs\\":true,\\"showUrls\\":true,\\"tileIcons\\":true,\\"catchOnce\\":true,\\"catchRules\\":\\"\\",\\"title\\":\\"Group B\\",\\"id\\":3}}","tabview-groups":"{\\"nextID\\":4,\\"activeGroupId\\":1,\\"activeGroupName\\":\\"Group A\\",\\"totalNumber\\":2}"}}]}';

describe('tm.import', () => {
  describe('#importTabGroupsJson', () => {
    beforeEach(() => {
      tm.bookmarks = {
        createFolder: jest.fn().mockImplementation((title) => {
          if (title === 'Group A') {
            return Promise.resolve({ id: 1 });
          } else if (title === 'Group B') {
            return Promise.resolve({ id: 2 });
          }
          return Promise.reject('Unexpected folder title');
        }),
        create: jest.fn().mockImplementation(() => Promise.resolve()),
      };
    });

    test('rejects if invalid JSON data', (done) => {
      tm.import.importTabGroupsJson('foo').catch(done);
    });

    test('create bookmarks from JSON data', () =>
      tm.import.importTabGroupsJson(json).then(() => {
        expect(tm.bookmarks.createFolder.mock.calls).toMatchSnapshot();
        expect(tm.bookmarks.create.mock.calls).toMatchSnapshot();
      }));
  });
});

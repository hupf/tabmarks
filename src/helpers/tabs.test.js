import tabsHelper from './tabs';
import tabsSync from '../background/tabs-sync';

jest.mock('../background/tabs-sync', () => ({
  disabled: false,
}));

describe('tabsHelper', () => {
  describe('#get', () => {
    beforeEach(() => {
      global.browser = {
        tabs: {
          get: jest.fn().mockImplementation(id => Promise.resolve({ id })),
        },
      };
    });

    test('returns tab with given id', () =>
      tabsHelper.get(5).then((result) => {
        expect(browser.tabs.get).toBeCalledWith(5);
        expect(result.id).toEqual(5);
      }));
  });

  describe('#getOfWindow', () => {
    beforeEach(() => {
      global.browser = {
        tabs: {
          query: jest.fn().mockImplementation((filter, cb) => {
            cb([
              { url: 'http://example.org' },
              { url: 'about:blank' },
            ]);
          }),
        },
      };
    });

    test('returns tabs with given windowId excluding pinned ones', () =>
      tabsHelper.getOfWindow(5).then((result) => {
        expect(browser.tabs.query.mock.calls[0][0]).toEqual({ windowId: 5, pinned: false });
        expect(result).toEqual([
          { url: 'http://example.org' },
          { url: 'about:blank' },
        ]);
      }));
  });

  describe('#getRelevantOfWindow', () => {
    beforeEach(() => {
      global.browser = {
        tabs: {
          query: jest.fn().mockImplementation((filter, cb) => {
            cb([
              { url: 'http://example.org' },
              { url: 'about:blank' },
            ]);
          }),
        },
      };
    });

    test('returns tabs with given windowId excluding pinned ones and about:*', () =>
      tabsHelper.getRelevantOfWindow(5).then((result) => {
        expect(browser.tabs.query.mock.calls[0][0]).toEqual({ windowId: 5, pinned: false });
        expect(result).toEqual([
          { url: 'http://example.org' },
        ]);
      }));
  });

  describe('#transformIndex', () => {
    beforeEach(() => {
      global.browser = {
        tabs: {
          query: jest.fn().mockImplementation((filter, cb) => {
            cb([
              { index: 0, pinned: true, url: 'https://01.example.org' },
              { index: 1, pinned: true, url: 'https://02.example.org' },
              { index: 2, pinned: false, url: 'https://03.example.org' },
              { index: 3, pinned: false, url: 'about:blank' },
              { index: 4, pinned: false, url: 'https://04.example.org' },
              { index: 5, pinned: false, url: 'about:addons' },
              { index: 6, pinned: false, url: 'https://05.example.org' },
            ]);
          }),
        },
      };
    });

    test('adjusts single index ignoring pinned and about:* tabs', () =>
      tabsHelper.transformIndex(6, 1).then((result) => {
        expect(result).toEqual(2);
        expect(browser.tabs.query.mock.calls[0][0]).toEqual({ windowId: 1 });
      }));

    test('adjusts multiple indices ignoring pinned and about:* tabs', () =>
      tabsHelper.transformIndex([4, 2, 6], 1).then((result) => {
        expect(result).toEqual([1, 0, 2]);
      }));

    test('returns null for pinned and about:* tabs', () =>
      tabsHelper.transformIndex([1, 3], 1).then((result) => {
        expect(result).toEqual([null, null]);
      }));
  });

  describe('#withTabSyncDisabled', () => {
    test('disables sync before calling promise callback', () => {
      expect(tabsSync.disabled).toBeFalsy();
      const func = () => {
        expect(tabsSync.disabled).toBeTruthy();
        return Promise.resolve('success');
      };

      return tabsHelper.withTabSyncDisabled(func)
        .then((result) => {
          expect(result).toEqual('success');

          return new Promise((resolve) => {
            setTimeout(() => {
              expect(tabsSync.disabled).toBeFalsy();
              resolve();
            });
          });
        });
    });

    test('also re-enables sync on error', () =>
      tabsHelper.withTabSyncDisabled(() => Promise.reject('failure'))
        .then(() => {}, (error) => {
          expect(error).toEqual('failure');

          return new Promise((resolve) => {
            setTimeout(() => {
              expect(tabsSync.disabled).toBeFalsy();
              resolve();
            });
          });
        }));
  });
});

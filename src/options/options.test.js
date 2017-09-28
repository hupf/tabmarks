import options from './options';
import importHelper from '../helpers/import';

jest.mock('../helpers/import', () => ({
  importTabGroupsJson: jest.fn().mockImplementation(() => Promise.resolve()),
}));

describe('options', () => {
  describe('#import', () => {
    beforeEach(() => {
      options.showImportProgress = jest.fn();
      options.showImportMessage = jest.fn();
      delete options.importField;
      options.importField = { value: '{ "foo": "bar" }' };
      options.port = { postMessage: jest.fn() };
    });

    test('imports JSON data and displays success message', () =>
      options.import().then(() => {
        expect(importHelper.importTabGroupsJson.mock.calls).toMatchSnapshot();
        expect(options.showImportProgress).toBeCalled();
        expect(options.showImportMessage.mock.calls).toMatchSnapshot();
      }));

    test('imports JSON data and displays failed folder/bookmark creations', () => {
      importHelper.importTabGroupsJson = jest.fn().mockImplementation((json, errorCallback) => {
        errorCallback({ type: 'folder', name: 'Group A', error: 'Folder creation failed' });
        errorCallback({ type: 'bookmark', name: 'https://developer.mozilla.org/en-US/', error: 'Bookmark creation failed' });
        errorCallback({ type: 'bookmark', name: 'https://github.com/', error: 'Bookmark creation failed' });
        return Promise.resolve();
      });
      return options.import().then(() => {
        expect(importHelper.importTabGroupsJson.mock.calls).toMatchSnapshot();
        expect(options.showImportProgress).toBeCalled();
        expect(options.showImportMessage.mock.calls).toMatchSnapshot();
      });
    });

    test('displays error on complete import failure', () => {
      importHelper.importTabGroupsJson = jest.fn().mockImplementation(() => Promise.reject('Bad'));
      return options.import().then(() => {
        expect(importHelper.importTabGroupsJson.mock.calls).toMatchSnapshot();
        expect(options.showImportProgress).toBeCalled();
        expect(options.showImportMessage.mock.calls).toMatchSnapshot();
      });
    });
  });
});

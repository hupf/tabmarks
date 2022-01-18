# Tabmarks

Web Extension for handling groups of tabs persisted as bookmarks.

Available on AMO here: https://addons.mozilla.org/firefox/addon/tabmarks/

[![Build Status](https://travis-ci.org/hupf/tabmarks.svg?branch=master)](https://travis-ci.org/hupf/tabmarks)


## Known issues

* Switching to a group loads all tabs (which is slow and clutters browser history), see #9
* No ability to rename, move or delete groups without browser restart, see #6
* No i18n support (currently English only)
* Only tested with Firefox


## Development (for Firefox)

Install dependencies:

    yarn install

Open Firefox and load the extension temporarily in the browser:

    yarn start

Linting:

    yarn lint

Testing:

    yarn test

Creating a ZIP file (will be put in `web-ext-artifacts/`):

    yarn build


## Author

Mathis Hofer (thanks to [Puzzle ITC](https://puzzle.ch) for letting me start this project)


## License

Distributed under the [MIT License](LICENSE).

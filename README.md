# Tabmarks

Web Extension for handling groups of tabs persisted as bookmarks.


## Known issues

* Only tested with Firefox.
* Changes on the persisted bookmarks will not yet be synchronized with the open tabs.


## Development (for Firefox)

Install dependencies:

    yarn install

Open Firefox and load the extension temporarily in the browser:

    yarn start

Linting:

    yarn lint

Creating a ZIP file (will be put in `web-ext-artifacts/`):

    yarn build


## Author

Mathis Hofer (thanks to [Puzzle ITC](https://puzzle.ch) for letting me starting this project)


## License

Distributed under the [MIT License](LICENSE).

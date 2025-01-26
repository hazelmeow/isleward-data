# isleward-data
Semi-automated extraction of game data from [Isleward](https://gitlab.com/isleward/isleward).

Most of the data is collected by cloning the Isleward source code,
transforming files (often using [ast-grep](https://ast-grep.github.io/)),
parsing stuff with zod or as json5, and sometimes some cursed `eval`.
Some data is also manually curated (for example, when the source code containing whatever config
isn't open-source).

## Contributing
Contributions are welcome.

To run locally: Install nodejs, pnpm, and git; clone, `pnpm i`, `pnpm dev`.
Generated files can be found under `generated/`.

Manually curated data found under `curated/` also needs to be kept up to date.

## License
MIT.

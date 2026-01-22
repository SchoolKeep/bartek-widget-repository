# AGENTS.md

## Project overview

This repository is a template for building and publishing widgets. Widgets are defined in `widgets/<widget_name>/` with
`widget.json` and `content.html`, and the registry is generated into `widget_registry.json`.

## Setup commands

- Install dependency (required): `jq`
  - macOS: `brew install jq`
  - Linux: `sudo apt-get install jq` or `sudo yum install jq`

## Common commands

- Build registry: `./bin/build-registry.sh`
- Dry run (no file write): `./bin/build-registry.sh --dry-run`
- Validate existing registry: `./bin/build-registry.sh --validate`

## Repository structure

```
.
├── bin/build-registry.sh
├── config/defaults.json
├── widget_registry.json
└── widgets/
    ├── WIDGET_SETUP.md
    └── <widget_name>/
        ├── widget.json
        └── content.html
```

## Widget authoring rules

- Create one directory per widget under `widgets/`.
- `widget.json` is required and must include:
  - `version` (semver), `title`, `description`
- The widget `type` is derived from the directory name; use lowercase and underscores.
- `content.html` is required and must be a self-contained HTML fragment:
  - Do not include `<html>`, `<head>`, or `<body>`
  - Inline all CSS and JavaScript
  - Do not use relative file references like `./styles.css` or `./script.js`
  - Absolute public URLs (CDNs, fonts) are allowed
- If using a build tool (Vite/Webpack/etc.), the build output must be a single HTML fragment placed in
  `content.html`.
- Do not edit `widget_registry.json` manually; always run the build script.

## Defaults and overrides

- Global defaults live in `config/defaults.json`.
- `widget.json` can override defaults and define:
  - `category`, `imageName`, `configuration`, `defaultConfig`, and other widget settings.
- When using `configuration`, template variables in `content.html` use `{{ variable_name }}`.

## Publishing notes

- `widget_registry.json` must be at the repo root.
- A watched GitHub branch triggers publishing when you push.
- Widget `type` values must be unique within a community.

## Troubleshooting

- "jq: command not found": install `jq` (see setup commands).
- "Missing required field": ensure `version`, `title`, and `description` are set in `widget.json`.
- "Content file not found": confirm `content.html` exists in the widget folder.

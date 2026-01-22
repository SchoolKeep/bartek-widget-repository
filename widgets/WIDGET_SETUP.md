# Widget Setup Guide

This guide explains how to create and manage widgets in the widgets repository.

## What is This?

This repository provides a system for managing widget configurations. Each widget is defined by:
- A `widget.json` configuration file with metadata (title, description, version, etc.)
- A `content.html` file containing the widget's complete content (HTML, CSS, and JavaScript)
- Optional additional files (for React widgets, build configurations, etc.)

**Important**: The `content.html` file must be completely self-contained. All HTML, CSS, and JavaScript must be included directly in this file. **Relative file references** (such as `<link rel="stylesheet" href="styles.css">` or `<script src="script.js">`) will not work, as the widget system only serves the `content.html` file itself. However, **publicly available endpoints** (absolute URLs like `https://cdn.example.com/style.css` or `https://fonts.googleapis.com/css2?family=...`) are accessible and can be used.

**Embedding Requirement**: Widgets are embedded into existing HTML pages, so the `content.html` file must be an HTML fragment. Do not include `<html>`, `<head>`, or `<body>` tags, as these will conflict with the host page structure.

The build script automatically scans all widgets, validates their configurations, and generates a unified `widget_registry.json` file that can be consumed by applications that need to display or manage these widgets.

## Overview

The widget registry system uses individual configuration files for each widget, which are then automatically merged into a single `widget_registry.json` file using the `bin/build-registry.sh` script. This approach provides:

- **Centralized Management**: All widgets are organized in the `widgets/` directory
- **Automatic Validation**: The build script ensures all configurations are valid
- **Version Control**: Each widget can be versioned independently
- **Easy Maintenance**: Add, update, or remove widgets without manually editing the registry

## File Structure

```
widgets-repo-template/
├── bin/
│   └── build-registry.sh    # Script to build widget_registry.json
├── config/
│   └── defaults.json        # Configuration and default values
├── widget_registry.json     # Generated registry (DO NOT EDIT MANUALLY)
└── widgets/
    ├── WIDGET_SETUP.md      # This documentation file
    ├── my_widget/
    │   ├── widget.json      # Widget-specific configuration
    │   └── content.html     # Widget HTML content
    └── another_widget/
        ├── widget.json
        └── content.html
```

## Prerequisites

Before creating widgets, ensure you have:

- `jq` installed for JSON processing
  - macOS: `brew install jq`
  - Linux: `sudo apt-get install jq` or `sudo yum install jq`
- Basic knowledge of HTML/CSS/JavaScript (depending on your widget type)
- Git (for version control, if using)

## Content File Requirements

### content.html

The `content.html` file is the single source of truth for your widget's content. **All HTML, CSS, and JavaScript must be included directly in this file.**

**Critical Requirements:**
- **HTML Fragment**: Widgets are embedded into existing pages, so do not include `<html>`, `<head>`, or `<body>` tags
- **Self-contained**: All styles must be in `<style>` tags within the HTML fragment, or use publicly available CDN resources
- **Inline JavaScript**: All scripts must be in `<script>` tags within the HTML fragment, or use publicly available CDN resources
- **No relative file references**: Relative file references (e.g., `href="styles.css"`, `src="./script.js"`, `src="../lib.js"`) will not work, as the widget system only serves the `content.html` file itself
- **Public endpoints are accessible**: Absolute URLs to publicly available resources (e.g., `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css`, `https://fonts.googleapis.com/css2?family=...`) will work and can be used

**Example of correct structure (with inline styles/scripts):**
```html
<style>
  .my-widget {
    color: blue;
    padding: 20px;
  }
</style>
<div class="my-widget">
  <h1>My Widget</h1>
</div>
<script>
  console.log('Widget loaded');
</script>
```

**Example using publicly available resources:**
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap">
<style>
  .my-widget {
    font-family: 'Roboto', sans-serif;
    color: blue;
    padding: 20px;
  }
</style>
<div class="my-widget">
  <h1>My Widget</h1>
</div>
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
<script>
  console.log('Widget loaded with lodash:', _.VERSION);
</script>
```

**For React/Modern Frameworks:**
If you're using a build tool (like Vite, Webpack, etc.), ensure your build process bundles all dependencies and outputs a single, self-contained HTML fragment. The build output should include all CSS and JavaScript inline or embedded, not as separate files. The output must be an HTML fragment (no `<html>`, `<head>`, or `<body>` tags) that can be embedded into existing pages.

## Configuration File

### defaults.json

This file contains both global configuration and default values for all widgets:

```json
{
  "visibility": "private",
  "contentFile": "content.html",
  "contentMethod": "GET",
  "requiresAuthentication": false,
  "cacheStrategy": "no-cache",
  "containers": ["Full width"],
  "widgetsLibrary": true,
  "settings": {
    "configurable": true,
    "editable": true,
    "removable": true,
    "shared": false,
    "movable": false
  }
}
```

**Global Configuration Fields:**
- `visibility` - Endpoint generation mode (must be `"private"`)
  - Generates relative paths (e.g., `./widgets/demo_widget/content.html`)
- `contentFile` - Name of the HTML content file (default: "content.html")
- `contentMethod` - HTTP method for fetching content (default: "GET")
- `requiresAuthentication` - Whether content requires auth (default: false)
- `cacheStrategy` - Cache strategy for content (default: "no-cache")

**Widget Default Fields:**
- `containers` - Available container types
- `widgetsLibrary` - Whether widget appears in library
- `settings` - Default widget behavior settings

### widget.json

Widget-specific configuration (only unique fields needed):

```json
{
  "version": "1.0.0",
  "title": "My Widget",
  "description": "Description of what this widget does",
  "category": "Demo",
  "imageName": "my_widget"
}
```

**Required fields:**
- `version` - Semantic version (e.g., "1.0.0")
- `title` - Display name of the widget
- `description` - Brief description of the widget

**Optional fields:**
- `category` - Widget category (default from config/defaults.json)
- `imageName` - Image identifier (defaults to directory name)
- `configuration` - Schema for user-configurable properties (see [Dynamic Widget Configuration](#dynamic-widget-configuration))
- `defaultConfig` - Default values for configurable properties
- Any other field from config/defaults.json can be overridden

## Dynamic Widget Configuration

Widgets can define configurable properties that allow users to customize widget behavior and appearance when adding the widget to a page. This is done through the `configuration` and `defaultConfig` fields in `widget.json`.

### Configuration Schema

The `configuration` field defines the blueprint for customizable properties:

```json
{
  "configuration": {
    "properties": [
      {
        "name": "propertyName",
        "label": "Display Label",
        "type": "text",
        "description": "Optional description",
        "defaultValue": "default value",
        "rules": {
          "required": true,
          "minLength": 1
        }
      }
    ]
  },
  "defaultConfig": {
    "propertyName": "default value"
  }
}
```

**Configuration Fields:**
- `properties` - An array of ConfigField definitions

**ConfigField Required Properties:**
- `name` - The property identifier used in `content.html` template variables
- `label` - Display label shown in the configuration UI
- `type` - The field type (see supported types below)

**ConfigField Optional Properties:**
- `description` - Helper text for the configuration UI
- `defaultValue` - Default value shown in the configuration UI
- `rules` - Validation rules such as `required`, `minLength`, `maxLength`, `minimum`, and `maximum`
- `options` - Required for `select` fields, array of `{ "value", "label" }`

**defaultConfig:**
- Initial default values for widget configuration properties
- Applied automatically when a new widget instance is added to a layout
- Values must match the field names defined in `configuration.properties`

### Supported ConfigField Types

| Type | Description |
|------|-------------|
| `text` | Single line text input |
| `number` | Numeric input field |
| `color` | Color picker |
| `date` | Date picker |
| `boolean` | Checkbox or toggle |
| `select` | Select dropdown |

### Template Variables in content.html

When a widget has configuration properties, you can use template variables in `content.html` to render dynamic content. Template variables use double curly brace syntax: `{{ variable_name }}`.

**Example content.html with template variables:**
```html
<style>
  .banner {
    background-color: {{ background_color }};
    color: {{ text_color }};
    padding: 20px;
  }
</style>
<div class="banner">
  <h1>{{ title }}</h1>
  <p>{{ subtitle }}</p>
</div>
```

The host application will replace these template variables with the actual configuration values when rendering the widget.

### Complete Configurable Widget Example

**widget.json:**
```json
{
  "version": "1.0.0",
  "title": "Card Grid",
  "description": "A configurable card grid with dynamic layout and styling",
  "category": "Content",
  "imageName": "card_grid",
  "configuration": {
    "properties": [
      {
        "name": "cards_per_row",
        "label": "Cards Per Row",
        "type": "number",
        "defaultValue": 3,
        "rules": {
          "required": true,
          "minimum": 1,
          "maximum": 6
        }
      },
      {
        "name": "card_background",
        "label": "Card Background",
        "type": "color",
        "defaultValue": "#ffffff"
      },
      {
        "name": "accent_color",
        "label": "Accent Color",
        "type": "color",
        "defaultValue": "#3b82f6"
      },
      {
        "name": "card_style",
        "label": "Card Style",
        "type": "select",
        "defaultValue": "shadow",
        "options": [
          { "value": "flat", "label": "Flat" },
          { "value": "shadow", "label": "Shadow" },
          { "value": "bordered", "label": "Bordered" }
        ]
      }
    ]
  },
  "defaultConfig": {
    "cards_per_row": 3,
    "card_background": "#ffffff",
    "accent_color": "#3b82f6",
    "card_style": "shadow"
  }
}
```

**content.html:**
```html
<style>
  .card-grid {
    display: grid;
    grid-template-columns: repeat({{ cards_per_row }}, 1fr);
    gap: 20px;
  }

  .card {
    background-color: {{ card_background }};
    padding: 24px;
    border-radius: 8px;
  }

  .card-style-shadow .card {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .card-style-bordered .card {
    border: 2px solid {{ accent_color }};
  }
</style>

<div class="card-grid card-style-{{ card_style }}">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>
```

## Creating a New Widget

1. **Create a new directory** in `widgets/`:
   ```bash
   mkdir widgets/my_new_widget
   ```

2. **Create `widget.json`** with your widget configuration:
   ```bash
   cat > widgets/my_new_widget/widget.json << 'EOF'
   {
     "version": "1.0.0",
     "title": "My New Widget",
     "description": "A widget that does amazing things",
     "category": "Demo",
     "imageName": "my_new_widget"
   }
   EOF
   ```

3. **Create `content.html`** with your widget HTML fragment (including all CSS and JavaScript):
   ```bash
   cat > widgets/my_new_widget/content.html << 'EOF'
   <style>
     .my-widget {
       padding: 20px;
       background-color: #f0f0f0;
     }
   </style>
   <div class="my-widget">
     <h1>My New Widget</h1>
     <p>Widget content goes here</p>
   </div>
   <script>
     console.log('Widget initialized');
   </script>
   EOF
   ```
   
   **Remember**: 
   - Relative file references (e.g., `href="styles.css"`, `src="./script.js"`) will not work
   - Publicly available endpoints (absolute URLs like `https://cdn.example.com/style.css`) are accessible and can be used
   - Do not include `<html>`, `<head>`, or `<body>` tags, as widgets are embedded into existing pages

4. **Build the registry**:
   ```bash
   ./bin/build-registry.sh
   ```

5. **Commit your changes**:
   ```bash
   git add widgets/my_new_widget/
   git commit -m "Add my_new_widget"
   git push
   ```

## Updating an Existing Widget

1. **Edit the widget files**:
   - Modify `widgets/my_widget/widget.json` (don't forget to bump version!)
   - Or modify `widgets/my_widget/content.html`

2. **Rebuild the registry**:
   ```bash
   ./bin/build-registry.sh
   ```

3. **Commit your changes**:
   ```bash
   git add widgets/my_widget/
   git add widget_registry.json
   git commit -m "Update my_widget to v1.0.1"
   git push
   ```

## Build Script Usage

The `bin/build-registry.sh` script supports several options:

### Standard Build
```bash
./bin/build-registry.sh
```
Generates `widget_registry.json` from all widget configurations.

### Dry Run
```bash
./bin/build-registry.sh --dry-run
```
Preview the output without writing to the file.

### Validate
```bash
./bin/build-registry.sh --validate
```
Validates the existing `widget_registry.json` file.

### Help
```bash
./bin/build-registry.sh --help
```
Display usage information.

## How It Works

1. **Reads** global configuration from `config/defaults.json`
2. **Scans** the `widgets/` directory for subdirectories
3. **Reads** each widget's `widget.json` configuration
4. **Merges** widget-specific defaults and config:
   - Widget-specific default values from `config/defaults.json` (excludes global config fields)
   - Widget-specific values from `widget.json`
   - Auto-generated values (type, endpoint URL)
5. **Validates** required fields are present
6. **Generates** the final `widget_registry.json`

### Auto-Generated Fields

- `type`: Derived from the directory name (e.g., `my_widget`)
- `content.endpoint`: Generated as a relative path
  - Format: `./widgets/{type}/content.html`
  - Uses relative paths for local widget content

## Validation Rules

The build script validates:

- Required files exist (`widget.json`, `content.html`)
- JSON is valid
- Required fields are present (`version`, `title`, `description`)
- Generated registry is valid JSON

## Troubleshooting

### Script fails with "jq: command not found"

The build script requires `jq` for JSON processing. Install it:

- **macOS**: `brew install jq`
- **Linux**: `sudo apt-get install jq` or `sudo yum install jq`
- **Windows**: Download from [jq's official website](https://stedolan.github.io/jq/download/)

### Script fails with "Missing required field"

Ensure your `widget.json` includes all required fields:
- `version`
- `title`
- `description`

### Widget not showing up in registry

1. Check directory structure is correct
2. Verify `widget.json` exists and is valid JSON
3. Verify `content.html` exists
4. Run with `--dry-run` to see detailed error messages

## Best Practices

1. **Always bump version** when making changes to a widget
2. **Use semantic versioning** (MAJOR.MINOR.PATCH)
3. **Run the build script** before committing
4. **Don't edit `widget_registry.json` manually** - it will be overwritten
5. **Keep widget names simple** - they become the `type` field (use lowercase, underscores)
6. **Test locally** with `--dry-run` before pushing
7. **Keep content.html self-contained** - Include all CSS and JavaScript inline, or use publicly available CDN resources; avoid relative file references
8. **Use HTML fragments only** - Do not include `<html>`, `<head>`, or `<body>` tags, as widgets are embedded into existing pages
9. **Use absolute URLs for external resources** - Relative file references won't work, but publicly available endpoints (CDNs, fonts, etc.) are accessible

## Examples

See the existing widgets in the `widgets/` directory for examples:

- `widgets/demo_widget/` - A simple widget example with basic HTML content
  - Demonstrates the minimal required structure: `widget.json` and `content.html`
  - Good starting point for understanding the basic widget format

- `widgets/react_hello_world/` - A React-based widget example using Vite
  - Shows how to integrate a modern JavaScript framework
  - Includes build configuration (`vite.config.ts`, `package.json`)
  - Demonstrates how to bundle React components into a widget

- `widgets/card_grid/` - A configurable card grid widget with dynamic layout and styling
  - Demonstrates the `configuration` and `defaultConfig` fields
  - Shows how to use template variables (`{{ variable_name }}`) in content.html
  - Includes multiple configuration types: number, color, and select
  - Well-commented HTML showing exactly how each config variable is used


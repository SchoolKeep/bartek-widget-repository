#!/bin/bash

# build-registry.sh
# Script to generate widget_registry.json from individual widget and stylesheet configs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WIDGETS_DIR="widgets"
STYLESHEETS_DIR="stylesheets"
DEFAULTS_FILE="config/defaults.json"
OUTPUT_FILE="widget_registry.json"

# Parse command line arguments
DRY_RUN=false
VALIDATE_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --validate)
      VALIDATE_ONLY=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Preview the output without writing to file"
      echo "  --validate   Validate existing widget_registry.json"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run '$0 --help' for usage information"
      exit 1
      ;;
  esac
done

# Function to print error messages
error() {
  echo -e "${RED}ERROR:${NC} $1" >&2
}

# Function to print success messages
success() {
  echo -e "${GREEN}SUCCESS:${NC} $1"
}

# Function to print warning messages
warning() {
  echo -e "${YELLOW}WARNING:${NC} $1"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  error "jq is required but not installed. Please install it:"
  echo "  macOS: brew install jq"
  echo "  Linux: apt-get install jq or yum install jq"
  exit 1
fi

# Validate mode
if [ "$VALIDATE_ONLY" = true ]; then
  if [ ! -f "$OUTPUT_FILE" ]; then
    error "File $OUTPUT_FILE does not exist"
    exit 1
  fi

  if jq empty "$OUTPUT_FILE" 2>/dev/null; then
    success "Valid JSON in $OUTPUT_FILE"

    # Check structure
    widget_count=$(jq '.widgets | length' "$OUTPUT_FILE")
    stylesheet_count=$(jq '.stylesheets // [] | length' "$OUTPUT_FILE")
    success "Found $widget_count widgets and $stylesheet_count stylesheets in registry"
    exit 0
  else
    error "Invalid JSON in $OUTPUT_FILE"
    exit 1
  fi
fi

# Check required files
if [ ! -f "$DEFAULTS_FILE" ]; then
  error "Defaults file $DEFAULTS_FILE not found"
  exit 1
fi

if [ ! -d "$WIDGETS_DIR" ]; then
  error "Widgets directory $WIDGETS_DIR not found"
  exit 1
fi

# Read widget defaults
CONTENT_FILE=$(jq -r '.widget_defaults.contentFile' "$DEFAULTS_FILE")
CONTENT_METHOD=$(jq -r '.widget_defaults.contentMethod' "$DEFAULTS_FILE")
REQUIRES_AUTH=$(jq -r '.widget_defaults.requiresAuthentication' "$DEFAULTS_FILE")
CACHE_STRATEGY=$(jq -r '.widget_defaults.cacheStrategy' "$DEFAULTS_FILE")

success "Loaded configuration from $DEFAULTS_FILE"

# ========================================
# Process widgets
# ========================================
WIDGETS_JSON="[]"
widget_count=0
error_count=0

for widget_dir in "$WIDGETS_DIR"/*; do
  if [ ! -d "$widget_dir" ]; then
    continue
  fi

  widget_name=$(basename "$widget_dir")
  widget_config="$widget_dir/widget.json"

  echo ""
  echo "Processing widget: $widget_name"

  # Check if widget.json exists
  if [ ! -f "$widget_config" ]; then
    error "  Missing widget.json in $widget_dir"
    ((error_count++))
    continue
  fi

  # Validate widget.json is valid JSON
  if ! jq empty "$widget_config" 2>/dev/null; then
    error "  Invalid JSON in $widget_config"
    ((error_count++))
    continue
  fi

  # Check required fields
  version=$(jq -r '.version // empty' "$widget_config")
  title=$(jq -r '.title // empty' "$widget_config")
  description=$(jq -r '.description // empty' "$widget_config")

  if [ -z "$version" ]; then
    error "  Missing required field: version"
    ((error_count++))
    continue
  fi

  if [ -z "$title" ]; then
    error "  Missing required field: title"
    ((error_count++))
    continue
  fi

  if [ -z "$description" ]; then
    error "  Missing required field: description"
    ((error_count++))
    continue
  fi

  # Check for widget-specific contentFile override
  widget_content_file=$(jq -r '.contentFile // empty' "$widget_config")
  if [ -n "$widget_content_file" ]; then
    content_file_name="$widget_content_file"
  else
    content_file_name="$CONTENT_FILE"
  fi

  content_file="$widget_dir/$content_file_name"

  # Check if content file exists
  if [ ! -f "$content_file" ]; then
    error "  Missing $content_file_name in $widget_dir"
    ((error_count++))
    continue
  fi

  # Generate content endpoint URL with the correct content file
  endpoint="./${WIDGETS_DIR}/${widget_name}/${content_file_name}"

  # Build the widget object by merging widget_defaults + widget.json + auto-generated fields
  widget=$(jq -n \
    --slurpfile defaults "$DEFAULTS_FILE" \
    --slurpfile widget "$widget_config" \
    --arg type "$widget_name" \
    --arg endpoint "$endpoint" \
    --arg method "$CONTENT_METHOD" \
    --argjson requiresAuth "$REQUIRES_AUTH" \
    --arg cacheStrategy "$CACHE_STRATEGY" \
    '
    # Merge all sources (use widget_defaults, not root)
    ($defaults[0].widget_defaults | del(.visibility, .contentFile, .contentMethod, .requiresAuthentication, .cacheStrategy)) * $widget[0] * {
      "type": $type,
      "content": {
        "endpoint": $endpoint,
        "method": ($widget[0].contentMethod // $method),
        "requiresAuthentication": ($widget[0].requiresAuthentication // $requiresAuth),
        "cacheStrategy": ($widget[0].cacheStrategy // $cacheStrategy)
      }
    } |
    # Remove widget-level content fields if they were used (they belong in content object only, or are used for URL generation)
    del(.contentFile, .contentMethod, .requiresAuthentication, .cacheStrategy) |
    # Reorder fields: priority fields first, then the rest
    # configuration and defaultConfig are optional fields for dynamic widget customization
    {
      title,
      description,
      version,
      category,
      type,
      imageName,
      content,
      configuration,
      defaultConfig
    } + . |
    # Remove null values from optional fields that were not provided
    del(.configuration | nulls) | del(.defaultConfig | nulls)
    ')

  # Add to widgets array
  WIDGETS_JSON=$(echo "$WIDGETS_JSON" | jq --argjson widget "$widget" '. + [$widget]')

  success "  Processed: $title (v$version)"
  ((widget_count++))
done

echo ""
echo "================================"

if [ $error_count -gt 0 ]; then
  error "Failed to process $error_count widget(s)"
  exit 1
fi

if [ $widget_count -eq 0 ]; then
  error "No widgets found to process"
  exit 1
fi

success "Successfully processed $widget_count widget(s)"

# ========================================
# Process stylesheets
# ========================================
STYLESHEETS_JSON="[]"
stylesheet_count=0

if [ -d "$STYLESHEETS_DIR" ]; then
  STYLESHEET_CONTENT_FILE=$(jq -r '.stylesheet_defaults.contentFile // "style.css"' "$DEFAULTS_FILE")

  for stylesheet_dir in "$STYLESHEETS_DIR"/*; do
    if [ ! -d "$stylesheet_dir" ]; then
      continue
    fi

    stylesheet_name=$(basename "$stylesheet_dir")
    stylesheet_config="$stylesheet_dir/stylesheet.json"

    echo ""
    echo "Processing stylesheet: $stylesheet_name"

    if [ ! -f "$stylesheet_config" ]; then
      error "  Missing stylesheet.json in $stylesheet_dir"
      ((error_count++))
      continue
    fi

    if ! jq empty "$stylesheet_config" 2>/dev/null; then
      error "  Invalid JSON in $stylesheet_config"
      ((error_count++))
      continue
    fi

    # Check required fields
    ss_name=$(jq -r '.name // empty' "$stylesheet_config")
    if [ -z "$ss_name" ]; then
      error "  Missing required field: name"
      ((error_count++))
      continue
    fi

    # Check for stylesheet-specific contentFile override
    ss_content_file=$(jq -r '.contentFile // empty' "$stylesheet_config")
    if [ -n "$ss_content_file" ]; then
      ss_file_name="$ss_content_file"
    else
      ss_file_name="$STYLESHEET_CONTENT_FILE"
    fi

    if [ ! -f "$stylesheet_dir/$ss_file_name" ]; then
      error "  Missing $ss_file_name in $stylesheet_dir"
      ((error_count++))
      continue
    fi

    ss_path="./${STYLESHEETS_DIR}/${stylesheet_name}/${ss_file_name}"

    # Merge stylesheet_defaults + stylesheet.json, set path, remove contentFile
    stylesheet=$(jq -n \
      --slurpfile defaults "$DEFAULTS_FILE" \
      --slurpfile ss "$stylesheet_config" \
      --arg path "$ss_path" \
      '($defaults[0].stylesheet_defaults // {}) * $ss[0] * {"path": $path} | del(.contentFile)')

    STYLESHEETS_JSON=$(echo "$STYLESHEETS_JSON" | jq --argjson ss "$stylesheet" '. + [$ss]')

    success "  Processed: $ss_name"
    ((stylesheet_count++))
  done

  if [ $stylesheet_count -gt 0 ]; then
    echo ""
    success "Successfully processed $stylesheet_count stylesheet(s)"
  fi
fi

if [ $error_count -gt 0 ]; then
  error "Failed to process some stylesheet(s)"
  exit 1
fi

# ========================================
# Assemble final registry
# ========================================
if [ $stylesheet_count -gt 0 ]; then
  REGISTRY_JSON=$(jq -n \
    --argjson widgets "$WIDGETS_JSON" \
    --argjson stylesheets "$STYLESHEETS_JSON" \
    '{widgets: $widgets, stylesheets: $stylesheets}')
else
  REGISTRY_JSON=$(jq -n --argjson widgets "$WIDGETS_JSON" '{widgets: $widgets}')
fi

# Output result
if [ "$DRY_RUN" = true ]; then
  echo ""
  warning "DRY RUN MODE - No files will be written"
  echo ""
  echo "$REGISTRY_JSON" | jq .
else
  echo "$REGISTRY_JSON" | jq . > "$OUTPUT_FILE"
  success "Written to $OUTPUT_FILE"
fi

echo ""
success "Build complete!"

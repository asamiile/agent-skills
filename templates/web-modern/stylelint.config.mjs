// Stylelint settings
// - stylelint-config-standard: base rules
// - stylelint-config-recess-order: property order (`stylelint --fix` sorts them)
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recess-order'],
  ignoreFiles: ['dist/**', 'release/**', 'node_modules/**'],
  rules: {
    // Write media queries as max-width/min-width. Range syntax (width <= ...) needs Safari 16.4 or later
    'media-feature-range-notation': 'prefix',
    // Class names in BEM: block__element--modifier
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$',
      { message: 'Use BEM class names (block__element--modifier)' },
    ],
  },
};

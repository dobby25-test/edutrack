# Frontend Utilities

Utility helpers used across frontend.

## Files
- `sanitize.js` -> sanitize and validate user input
- `theme.js` -> global theme helpers

## Why important
- protects UI from unsafe input
- keeps password/email checks consistent
- keeps theme behavior consistent across pages

## Important code
```js
DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
```

```js
document.documentElement.setAttribute('data-theme', nextTheme);
window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: nextTheme } }));
```

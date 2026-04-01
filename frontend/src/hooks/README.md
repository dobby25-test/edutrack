# Custom Hooks

Reusable React hooks.

## File
- `useGlobalTheme.js`

## What it does
- gets initial theme
- applies selected theme
- listens for theme change events
- provides `toggleTheme`

## Important code
```js
const [theme, setTheme] = useState(getInitialTheme);
useEffect(() => { applyTheme(theme); }, [theme]);
```

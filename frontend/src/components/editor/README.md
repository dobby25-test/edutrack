# Editor Components

Code editor and submission components.

## Files
- `CodeEditor.jsx` -> write/run/preview code
- `SubmitWithEditor.jsx` -> assignment submit wrapper
- `CodeViewer.jsx` -> read-only code view

## Flow
1. load existing code or draft
2. autosave draft to localStorage
3. run code through backend execute API
4. submit assignment with code + comments

## Important code
```js
saveTimer.current = setTimeout(() => onSaveDraft?.(code, language), 2000);
```

```js
const out = await runCode(code, language, stdin, setRunStatus);
```

```js
await projectService.submitAssignment(assignmentId, { codeContent: code, language, studentComments: comments });
```

# Data Models

Models define database tables and relations.

## Core models
- `User`
- `Project`
- `Assignment`
- `Submission`
- `Badge`
- `Notification`
- `ExecutionUsage`

## Relation summary
- teacher user -> many projects
- project -> many assignments
- student user -> many assignments
- assignment -> one submission
- user -> many badges and notifications

## Important code
```js
// User password hash hooks
beforeCreate: async (user) => { user.password = await bcrypt.hash(user.password, salt); }
```

```js
// no duplicate assignment for same project/student
indexes: [{ unique: true, fields: ['projectId', 'studentId'] }]
```

```js
// one submission per assignment
assignmentId: { unique: true }
```

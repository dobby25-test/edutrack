# Controllers

Controllers contain the main business logic.

## Files
- `authController.js`
- `projectController.js`
- `analyticsController.js`
- `badgeController.js`
- `leaderboardcontroller.js`
- `notificationController.js`
- `profilecontrollers.js`
- `bulkImportBackend.js`

## Example flow: grading
1. Teacher sends marks and feedback.
2. Controller verifies teacher owns project.
3. Submission status is updated to graded.
4. Assignment status is updated.
5. Badge and notification services are triggered.

## Important code
```js
// refresh token saved as hash
await user.update({ refreshToken: hashToken(refreshToken), refreshExpires });
```

```js
// prevent duplicate assignment
await Assignment.bulkCreate(rows, { ignoreDuplicates: true });
```

```js
// student code execution daily limit
usage = await consumeStudentExecutionQuota(req.user.id);
```

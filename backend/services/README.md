# Backend Services

Services contain reusable side-effect logic.

## Files
- `emailService.js`
- `notificationServices.js`

## What services do
- send welcome/reset/assignment/grade emails
- create in-app notifications for users

## Important code
```js
if (config.service === 'sendgrid') {
  await sendViaSendGridApi(...);
} else {
  await transporter.sendMail(...);
}
```

```js
await Notification.create({ userId, type, title, message, icon, link });
```

# Teacher Components

Teacher workflow components.

## Files
- `CreateProjectModal.jsx`
- `ProjectList.jsx`
- `StudentSelector.jsx`
- `SubmissionView.jsx`
- `GradingModal.jsx`
- `ReportsView.jsx`
- `StatsCards.jsx`
- `TeacherProfile.jsx`

## Teacher flow
1. create project
2. assign students
3. review submissions
4. grade and add feedback
5. view reports and insights

## Important code
```js
await projectService.createProject(formData);
await onAssign(projectId, selectedStudents);
await projectService.gradeSubmission(submissionId, marks, feedback);
```

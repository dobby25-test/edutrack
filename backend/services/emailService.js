const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const getEmailConfig = () => ({
  service: (process.env.EMAIL_SERVICE || 'gmail').trim().toLowerCase(),
  user: (process.env.EMAIL_USER || '').trim(),
  pass: (process.env.EMAIL_PASSWORD || process.env.SENDGRID_API_KEY || '').trim(),
  from: (process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.EMAIL_USER || '').trim(),
});

const getAppBaseUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
const buildAppUrl = (path = '') => `${getAppBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

const createSmtpTransporter = (config) => {
  if (!config.user || !config.pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: config.service,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

const sendViaSendGridApi = async ({ to, subject, html, text, from }) => {
  sgMail.setApiKey(from.pass);
  await sgMail.send({
    to,
    from: {
      email: from.email,
      name: 'EduTrack',
    },
    subject,
    html,
    text: text || stripHtml(html),
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const config = getEmailConfig();

  if (!config.from) {
    return { success: false, error: 'EMAIL_FROM (or FROM_EMAIL) is missing' };
  }

  try {
    if (config.service === 'sendgrid') {
      if (!config.pass) {
        return { success: false, error: 'SENDGRID_API_KEY (or EMAIL_PASSWORD) is missing' };
      }

      await sendViaSendGridApi({
        to,
        subject,
        html,
        text,
        from: { email: config.from, pass: config.pass },
      });
      return { success: true };
    }

    const transporter = createSmtpTransporter(config);
    if (!transporter) {
      return { success: false, error: 'EMAIL_USER/EMAIL_PASSWORD are missing for SMTP service' };
    }

    const info = await transporter.sendMail({
      from: `"EduTrack" <${config.from}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    const details = error?.response?.body?.errors?.[0]?.message;
    return { success: false, error: details || error.message || 'Email send failed' };
  }
};

const sendWelcomeEmail = async (user, password = null) => {
  const subject = `Welcome to EduTrack, ${user.name}!`;
  const loginUrl = buildAppUrl('/login');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: #fff; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
        .badge { display: inline-block; padding: 8px 16px; background: #2196f3; color: #fff; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 10px 0; }
        .credentials { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
        .credentials strong { color: #1a1a2e; }
        .button { display: inline-block; padding: 14px 28px; background: #1a1a2e; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to EduTrack</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${user.name}</strong>,</p>

          <p>Your EduTrack account has been successfully created.</p>

          <span class="badge">${user.role.toUpperCase()}</span>
          ${user.department ? `<span class="badge">${user.department}</span>` : ''}

          <div class="credentials">
            <p style="margin-top: 0;"><strong>Your Login Credentials:</strong></p>
            <p>Email: <strong>${user.email}</strong></p>
            ${password ? `<p>Password: <strong>${password}</strong></p>` : '<p>Password: <em>The one you set during registration</em></p>'}
          </div>

          ${password ? '<p style="color: #e65100;"><strong>Important:</strong> Please change your password after first login.</p>' : ''}

          <a href="${loginUrl}" class="button">Login to EduTrack</a>

          <p>Best regards,<br><strong>The EduTrack Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email from EduTrack.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: user.email, subject, html });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = buildAppUrl(`/reset-password/${resetToken}`);
  const subject = 'Reset Your EduTrack Password';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #c0392b; color: #fff; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
        .alert { background: #ffebee; border-left: 4px solid #c0392b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .button { display: inline-block; padding: 14px 28px; background: #c0392b; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .code { background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace; margin: 20px 0; word-break: break-all; }
        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${user.name}</strong>,</p>

          <p>We received a request to reset your password.</p>

          <div class="alert">
            <strong>Security Notice:</strong> If you did not request this, you can ignore this email.
          </div>

          <p>Click below to reset your password. This link expires in <strong>1 hour</strong>.</p>

          <a href="${resetUrl}" class="button">Reset Password</a>

          <p>Or copy this URL:</p>
          <div class="code">${resetUrl}</div>

          <p>Best regards,<br><strong>The EduTrack Team</strong></p>
        </div>
        <div class="footer">
          <p>This link expires in 1 hour and can be used only once.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: user.email, subject, html });
};

const sendAssignmentNotification = async (student, project, teacher) => {
  const subject = `New Assignment: ${project.title}`;
  const dashboardUrl = buildAppUrl('/student/dashboard');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2471a3; color: #fff; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
        .project-card { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2471a3; }
        .due-date { background: #fff3cd; padding: 10px 15px; border-radius: 6px; margin: 15px 0; color: #856404; }
        .button { display: inline-block; padding: 14px 28px; background: #2471a3; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Assignment</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${student.name}</strong>,</p>

          <p>You have been assigned a new project by <strong>${teacher.name}</strong>.</p>

          <div class="project-card">
            <h2 style="margin-top: 0; color: #2471a3;">${project.title}</h2>
            ${project.subject ? `<p><strong>Subject:</strong> ${project.subject}</p>` : ''}
            ${project.description ? `<p><strong>Description:</strong> ${project.description}</p>` : ''}
            ${project.maxMarks ? `<p><strong>Maximum Marks:</strong> ${project.maxMarks}</p>` : ''}
          </div>

          ${project.dueDate ? `
          <div class="due-date">
            <strong>Due Date:</strong> ${new Date(project.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          ` : ''}

          <a href="${dashboardUrl}" class="button">View Assignment</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: student.email, subject, html });
};

const sendGradeNotification = async (student, project, submission) => {
  const percentage = Math.round((submission.marks / project.maxMarks) * 100);
  const subject = `Your work has been graded: ${project.title}`;
  const dashboardUrl = buildAppUrl('/student/dashboard');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e8449; color: #fff; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
        .grade-card { background: #e8f5e9; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #1e8449; }
        .grade-score { font-size: 48px; font-weight: 700; color: #1e8449; margin: 10px 0; }
        .feedback { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2471a3; }
        .button { display: inline-block; padding: 14px 28px; background: #1e8449; color: #fff; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Work Has Been Graded</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${student.name}</strong>,</p>
          <p>Your submission for <strong>${project.title}</strong> has been graded.</p>

          <div class="grade-card">
            <p style="margin: 0; font-size: 14px; color: #666;">Your Score</p>
            <div class="grade-score">${submission.marks}/${project.maxMarks}</div>
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1e8449;">${percentage}%</p>
          </div>

          ${submission.teacherFeedback ? `
          <div class="feedback">
            <p style="margin-top: 0;"><strong>Teacher Feedback:</strong></p>
            <p>${submission.teacherFeedback}</p>
          </div>
          ` : ''}

          <a href="${dashboardUrl}" class="button">View Details</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: student.email, subject, html });
};

const stripHtml = (html) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAssignmentNotification,
  sendGradeNotification,
};

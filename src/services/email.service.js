import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM =
  process.env.EMAIL_FROM || "EduTrack <onboarding@resend.dev>";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailLayout({
  title,
  name,
  schoolName,
  role,
  email,
  loginUrl,
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f1f5f9;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:16px;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(15,23,42,.08);
  ">

    <div style="
      background:#06b6d4;
      padding:28px;
      text-align:center;
    ">
      <h1 style="
        margin:0;
        color:#ffffff;
        font-size:28px;
      ">
        EduTrack
      </h1>

      <p style="
        margin:8px 0 0;
        color:#e0f2fe;
        font-size:14px;
      ">
        School Management Platform
      </p>
    </div>

    <div style="padding:32px">

      <h2 style="
        margin:0 0 16px;
        color:#0f172a;
        font-size:22px;
      ">
        ${escapeHtml(title)}
      </h2>

      <p style="
        color:#334155;
        font-size:16px;
        line-height:1.6;
      ">
        Hello <strong>${escapeHtml(name)}</strong>,
      </p>

      <p style="
        color:#475569;
        font-size:15px;
        line-height:1.7;
      ">
        Your EduTrack account has been created successfully.
      </p>

      ${
        schoolName
          ? `
      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:12px;
        padding:18px;
        margin:24px 0;
      ">

        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
          SCHOOL
        </p>

        <p style="
          margin:0;
          color:#0f172a;
          font-size:17px;
          font-weight:bold;
        ">
          ${escapeHtml(schoolName)}
        </p>

      </div>
      `
          : ""
      }

      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:12px;
        padding:20px;
        margin:24px 0;
      ">

        <p style="
          margin:0 0 10px;
          color:#64748b;
          font-size:13px;
        ">
          LOGIN DETAILS
        </p>

        <p style="
          margin:8px 0;
          color:#0f172a;
          font-size:15px;
        ">
          <strong>Email:</strong>
          ${escapeHtml(email)}
        </p>

        <p style="
          margin:8px 0;
          color:#0f172a;
          font-size:15px;
        ">
          <strong>Role:</strong>
          ${escapeHtml(role)}
        </p>

      </div>

      <p style="
        color:#475569;
        font-size:14px;
        line-height:1.7;
      ">
        Use the password provided to you when your account was created.
        You can change your password after signing in.
      </p>

      <div style="text-align:center;margin:30px 0">

        <a
          href="${escapeHtml(loginUrl)}"
          style="
            display:inline-block;
            background:#06b6d4;
            color:#ffffff;
            text-decoration:none;
            padding:14px 26px;
            border-radius:10px;
            font-size:15px;
            font-weight:bold;
          "
        >
          Login to EduTrack
        </a>

      </div>

      <p style="
        color:#94a3b8;
        font-size:12px;
        line-height:1.6;
        text-align:center;
      ">
        If you did not expect this account, please contact your school
        administrator.
      </p>

    </div>

    <div style="
      padding:20px;
      background:#f8fafc;
      text-align:center;
      border-top:1px solid #e2e8f0;
    ">
      <p style="
        margin:0;
        color:#94a3b8;
        font-size:12px;
      ">
        © ${new Date().getFullYear()} EduTrack
      </p>
    </div>

  </div>

</body>
</html>
`;
}

async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "⚠️ RESEND_API_KEY is not configured. Email was not sent."
    );

    return {
      success: false,
      skipped: true,
    };
  }

  if (!to) {
    console.warn(
      "⚠️ Email recipient is missing. Email was not sent."
    );

    return {
      success: false,
      skipped: true,
    };
  }

  try {
    const { data, error } = await resend.emails.send(
      {
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
      },
      idempotencyKey
        ? {
            idempotencyKey,
          }
        : undefined
    );

    if (error) {
      console.error(
        "❌ RESEND ERROR:",
        error
      );

      return {
        success: false,
        error,
      };
    }

    console.log(
      `✅ Email sent to ${to}`,
      data?.id || ""
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      "❌ EMAIL SEND FAILED:",
      error
    );

    return {
      success: false,
      error,
    };
  }
}

/* =========================================
   SCHOOL ADMIN
========================================= */

export async function sendSchoolWelcomeEmail({
  adminFirstName,
  adminEmail,
  schoolName,
  loginUrl,
  schoolId,
}) {
  const html = emailLayout({
    title: "Welcome to EduTrack",
    name: adminFirstName,
    schoolName,
    role: "School Administrator",
    email: adminEmail,
    loginUrl,
  });

  return sendEmail({
    to: adminEmail,
    subject: `Welcome to EduTrack - ${schoolName}`,
    html,
    idempotencyKey: schoolId
      ? `school-welcome-${schoolId}`
      : undefined,
  });
}

/* =========================================
   TEACHER
========================================= */

export async function sendTeacherWelcomeEmail({
  firstName,
  email,
  schoolName,
  loginUrl,
  teacherId,
}) {
  const html = emailLayout({
    title: "Your Teacher Account Is Ready",
    name: firstName,
    schoolName,
    role: "Teacher",
    email,
    loginUrl,
  });

  return sendEmail({
    to: email,
    subject: `Your EduTrack Teacher Account - ${schoolName}`,
    html,
    idempotencyKey: teacherId
      ? `teacher-welcome-${teacherId}`
      : undefined,
  });
}

/* =========================================
   PARENT
========================================= */

export async function sendParentWelcomeEmail({
  firstName,
  email,
  schoolName,
  loginUrl,
  parentId,
}) {
  const html = emailLayout({
    title: "Your Parent Account Is Ready",
    name: firstName,
    schoolName,
    role: "Parent",
    email,
    loginUrl,
  });

  return sendEmail({
    to: email,
    subject: `Your EduTrack Parent Account - ${schoolName}`,
    html,
    idempotencyKey: parentId
      ? `parent-welcome-${parentId}`
      : undefined,
  });
}

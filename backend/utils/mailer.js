const nodemailer = require('nodemailer');

const toBoolean = (value, fallbackValue) => {
  if (typeof value === 'undefined') {
    return fallbackValue;
  }

  return String(value).toLowerCase() === 'true';
};

const hasMailConfig = () => Boolean(
  process.env.SMTP_USER
  && process.env.SMTP_PASS
  && (process.env.SMTP_SERVICE || process.env.SMTP_HOST)
);

const createTransporter = () => {
  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: toBoolean(process.env.SMTP_SECURE, true),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  hasMailConfig,
  sendMail,
};

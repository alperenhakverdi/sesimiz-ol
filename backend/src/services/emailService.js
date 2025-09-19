import nodemailer from 'nodemailer';
import logSecurityEvent from './securityLogger.js';

let transporter;

const buildTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is incomplete');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const mailer = buildTransporter();

  const from = `${process.env.EMAIL_FROM_NAME || 'Sesimiz Ol'} <${process.env.EMAIL_FROM || 'noreply@sesimiz-ol.com'}>`;

  const info = await mailer.sendMail({
    from,
    to,
    subject,
    html,
    text
  });

  logSecurityEvent({
    event: 'EMAIL_SENT',
    userId: null,
    ip: null,
    meta: {
      to,
      subject
    }
  });

  return info;
};

export default {
  sendEmail
};

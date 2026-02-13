const Mailgun = require('mailgun.js');
const formData = require('form-data');

let cachedMailgunClient = null;
let cachedNodemailerTransporter = null;

function getDefaults() {
  const storeName = process.env.STORE_NAME || 'AUSTINE';
  const ownerEmail = process.env.STORE_OWNER_EMAIL || '';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Mailgun expects a valid RFC5322 from string like: "AUSTINE <no-reply@mg.example.com>"
  // If not configured, we still return a safe placeholder to avoid crashes.
  const from = process.env.MAIL_FROM || `${storeName} <no-reply@localhost>`;

  return {
    storeName,
    ownerEmail,
    frontendUrl,
    from
  };
}

function getProvider() {
  const forced = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  if (forced) return forced;

  const hasMailgun = Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
  if (hasMailgun) return 'mailgun';

  const smtpUser = String(process.env.SMTP_USER || '').trim();
  const smtpPass = String(process.env.SMTP_PASS || '').trim();
  const smtpLooksPlaceholder =
    smtpUser.toLowerCase().includes('your-email') ||
    smtpUser.toLowerCase().includes('example') ||
    smtpPass.toLowerCase().includes('your-app-password') ||
    smtpPass.toLowerCase().includes('password');

  const hasSmtp = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    smtpUser &&
    smtpPass &&
    !smtpLooksPlaceholder
  );
  if (hasSmtp) return 'smtp';

  return 'disabled';
}

function isStrictEmailMode() {
  const raw = String(process.env.EMAIL_STRICT || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function getMailgunClient() {
  if (cachedMailgunClient) return cachedMailgunClient;
  const apiKey = process.env.MAILGUN_API_KEY;

  const mailgunBaseUrl = String(process.env.MAILGUN_BASE_URL || '').trim();
  const clientConfig = { username: 'api', key: apiKey };
  if (mailgunBaseUrl) clientConfig.url = mailgunBaseUrl;

  cachedMailgunClient = new Mailgun(formData).client(clientConfig);
  return cachedMailgunClient;
}

function getSmtpTransporter() {
  if (cachedNodemailerTransporter) return cachedNodemailerTransporter;

  // Lazy require so the backend can still run even if nodemailer isn't installed yet.
  // (We add it to dependencies, but this keeps things resilient.)
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');

  const port = Number(process.env.SMTP_PORT);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase().trim();
  const useSecure = secure === '1' || secure === 'true' || secure === 'yes' || port === 465;

  cachedNodemailerTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: useSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return cachedNodemailerTransporter;
}

async function sendMail({ to, subject, text, html, from } = {}) {
  const { from: defaultFrom } = getDefaults();
  const finalFrom = from || defaultFrom;

  if (!to) {
    throw new Error('sendMail: "to" is required');
  }
  if (!subject) {
    throw new Error('sendMail: "subject" is required');
  }

  const provider = getProvider();

  const message = { from: finalFrom, to, subject };
  if (text) message.text = text;
  if (html) message.html = html;

  if (provider === 'disabled' || provider === 'console') {
    if (process.env.NODE_ENV !== 'test') {
      const mode = provider === 'console' ? 'Email (console mode)' : 'Email skipped (provider disabled/unconfigured)';
      console.warn(`${mode}: to=${to} subject=${subject}`);
    }
    if (isStrictEmailMode()) {
      throw new Error('Email provider is disabled/unconfigured (set MAILGUN_* or SMTP_* or EMAIL_PROVIDER)');
    }
    return { skipped: true, provider, to, subject };
  }

  if (provider === 'mailgun') {
    const domain = process.env.MAILGUN_DOMAIN;
    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey || !domain) {
      if (isStrictEmailMode()) {
        throw new Error('Mailgun not configured (set MAILGUN_API_KEY and MAILGUN_DOMAIN)');
      }
      console.warn('Email skipped (Mailgun not configured): set MAILGUN_API_KEY and MAILGUN_DOMAIN');
      return { skipped: true, provider, to, subject };
    }
    const mg = getMailgunClient();
    return mg.messages.create(domain, message);
  }

  if (provider === 'smtp') {
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!hasSmtp) {
      if (isStrictEmailMode()) {
        throw new Error('SMTP not configured (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)');
      }
      console.warn('Email skipped (SMTP not configured): set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS');
      return { skipped: true, provider, to, subject };
    }
    const transporter = getSmtpTransporter();
    return transporter.sendMail(message);
  }

  throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`);
}

module.exports = {
  getDefaults,
  sendMail
};

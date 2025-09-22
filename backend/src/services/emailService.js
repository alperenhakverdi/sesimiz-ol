import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import logSecurityEvent from './securityLogger.js';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      credential: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Firebase email template helper
const generateEmailTemplate = (type, data) => {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
      .header { background: #6B46C1; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; }
      .button { background: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
      .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 14px; color: #666; }
    </style>
  `;

  const templates = {
    password_reset: `
      ${baseStyle}
      <div class="header">
        <h1>Sesimiz Ol</h1>
        <p>Şifre Sıfırlama Talebi</p>
      </div>
      <div class="content">
        <h2>Merhaba,</h2>
        <p>Şifre sıfırlama talebiniz için onay kodunuz:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${data.otp}
        </div>
        <p>Bu kod <strong>15 dakika</strong> boyunca geçerlidir.</p>
        <p>Bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
      </div>
      <div class="footer">
        <p>Bu e-posta Sesimiz Ol platformundan otomatik olarak gönderilmiştir.</p>
        <p>© 2024 Sesimiz Ol - Kadınların Hikayelerini Güvenle Paylaştığı Platform</p>
      </div>
    `,
    welcome: `
      ${baseStyle}
      <div class="header">
        <h1>Sesimiz Ol'a Hoş Geldiniz!</h1>
      </div>
      <div class="content">
        <h2>Merhaba ${data.nickname},</h2>
        <p>Sesimiz Ol platformuna katıldığınız için teşekkür ederiz!</p>
        <p>Artık güvenli bir ortamda hikayelerinizi paylaşabilir, diğer kullanıcıların deneyimlerinden ilham alabilirsiniz.</p>
        <a href="${data.loginUrl}" class="button">Platforma Giriş Yap</a>
      </div>
      <div class="footer">
        <p>© 2024 Sesimiz Ol</p>
      </div>
    `
  };

  return templates[type] || '';
};

export const sendEmail = async ({ to, subject, type, data }) => {
  try {
    // For development, log email instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:');





      logSecurityEvent({
        event: 'EMAIL_SIMULATED',
        userId: data?.userId || null,
        ip: null,
        meta: { to, subject, type }
      });

      return { messageId: 'dev-simulation', accepted: [to] };
    }

    // For production, integrate with Firebase Cloud Functions or external email service
    const html = generateEmailTemplate(type, data);

    // This would be replaced with Firebase Functions trigger or external email service
    const emailPayload = {
      to,
      subject,
      html,
      from: process.env.EMAIL_FROM || 'noreply@sesimiz-ol.com'
    };

    // Log the email sending event
    logSecurityEvent({
      event: 'EMAIL_SENT',
      userId: data?.userId || null,
      ip: null,
      meta: { to, subject, type }
    });

    // For now, return mock success for development
    return {
      messageId: `mock-${Date.now()}`,
      accepted: [to],
      envelope: { from: emailPayload.from, to: [to] }
    };

  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('E-posta gönderilemedi');
  }
};

export default {
  sendEmail
};
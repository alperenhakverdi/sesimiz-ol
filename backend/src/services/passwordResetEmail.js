import { sendEmail } from './emailService.js';
import { getPasswordResetTtlMinutes } from './passwordResetService.js';

const sanitizeBaseUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const buildResetUrl = (token) => {
  const base = sanitizeBaseUrl(process.env.FRONTEND_URL || 'http://localhost:5173');
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
};

const buildSubject = () => 'Şifre sıfırlama isteği';

const buildHtmlBody = ({ nickname, otp, token, expiresAt }) => {
  const ttlMinutes = getPasswordResetTtlMinutes();
  const resetUrl = buildResetUrl(token);

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <p>Merhaba ${nickname ? `<strong>${nickname}</strong>` : 'değerli kullanıcımız'},</p>
      <p>Şifre sıfırlama talebiniz alındı. Lütfen aşağıdaki doğrulama kodunu uygulamada ilgili alana girin:</p>
      <p style="font-size: 24px; letter-spacing: 4px; font-weight: bold;">${otp}</p>
      <p>Kod ${ttlMinutes} dakika içinde kullanılmalıdır. Kodun süresi dolarsa yeni bir talep oluşturabilirsiniz.</p>
      <p>Alternatif olarak bu bağlantıya tıklayabilirsiniz:</p>
      <p><a href="${resetUrl}" style="color: #2563eb;">Şifremi sıfırla</a></p>
      <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelin. Hesabınız güvende kalacaktır.</p>
      <p>Sevgiler,<br />Sesimiz Ol Ekibi</p>
      <hr style="margin-top: 24px; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #6b7280;">Bu bağlantı ${new Date(expiresAt).toLocaleString()} tarihine kadar geçerlidir.</p>
    </div>
  `;
};

const buildTextBody = ({ nickname, otp, token, expiresAt }) => {
  const ttlMinutes = getPasswordResetTtlMinutes();
  const resetUrl = buildResetUrl(token);

  return [
    `Merhaba ${nickname || 'değerli kullanıcımız'},`,
    '',
    'Şifre sıfırlama talebiniz alındı. Doğrulama kodunuz:',
    otp,
    '',
    `Kod ${ttlMinutes} dakika içinde kullanılmalıdır.`,
    'Ayrıca aşağıdaki bağlantıyı da kullanabilirsiniz:',
    resetUrl,
    '',
    `Bu bağlantı ${new Date(expiresAt).toLocaleString()} tarihine kadar geçerlidir.`,
    '',
    'Eğer bu isteği siz yapmadıysanız, lütfen bu mesajı dikkate almayın.',
    '',
    'Sesimiz Ol Ekibi'
  ].join('\n');
};

export const sendPasswordResetEmail = async ({ email, nickname, otp, token, expiresAt }) => {
  await sendEmail({
    to: email,
    subject: buildSubject(),
    html: buildHtmlBody({ nickname, otp, token, expiresAt }),
    text: buildTextBody({ nickname, otp, token, expiresAt })
  });
};

export default {
  sendPasswordResetEmail
};

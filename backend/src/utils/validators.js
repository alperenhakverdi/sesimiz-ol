import { body } from 'express-validator';

export const PASSWORD_MIN_LENGTH = Number(process.env.PASSWORD_MIN_LENGTH || 8);
export const PASSWORD_MAX_LENGTH = Number(process.env.PASSWORD_MAX_LENGTH || 64);

const passwordRegex = new RegExp(
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{' + PASSWORD_MIN_LENGTH + ',' + PASSWORD_MAX_LENGTH + '}$'
);

export const passwordValidator = (field = 'password') =>
  body(field)
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(`Şifre ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} karakter arası olmalıdır`)
    .matches(passwordRegex)
    .withMessage('Şifre en az 1 küçük harf, 1 büyük harf, 1 rakam ve 1 özel karakter içermelidir');

export const optionalPasswordValidator = (field = 'password') =>
  body(field)
    .optional()
    .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
    .withMessage(`Şifre ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} karakter arası olmalıdır`)
    .matches(passwordRegex)
    .withMessage('Şifre en az 1 küçük harf, 1 büyük harf, 1 rakam ve 1 özel karakter içermelidir');

export const nicknameValidator = (field = 'nickname', required = true) => {
  const chain = body(field)
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Kullanıcı adı 2-20 karakter arası olmalıdır')
    .matches(/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam, _, - karakterleri içerebilir');

  return required ? chain : chain.optional();
};

export const emailValidator = (field = 'email', required = false) => {
  const chain = body(field)
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail();

  return required ? chain : chain.optional({ checkFalsy: true });
};

export const bioValidator = (field = 'bio', required = false) => {
  const chain = body(field)
    .trim()
    .isLength({ max: 280 })
    .withMessage('Hakkında alanı en fazla 280 karakter olabilir');

  return required ? chain : chain.optional({ checkFalsy: true });
};

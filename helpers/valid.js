const { check } = require("express-validator");
exports.validSign = [
  check("name", { en: "Name is required", tr: "İsim gerekli" })
    .notEmpty()
    .isLength({
      min: 2,
      max: 32,
    })
    .withMessage({
      en: "name must be between 2 to 32 characters",
      tr: "İsim en az 2 haneli olmalı",
    }),
  check("surname", { en: "surname is required", tr: "Soyisim gerekli" })
    .notEmpty()
    .isLength({
      min: 2,
      max: 32,
    })
    .withMessage({
      en: "surname must be between 2 to 32 characters",
      tr: "Soyisim en az 2 haneli olmalı",
    }),
  check("email").isEmail().withMessage({
    en: "Must be a valid email address",
    tr: "Geçerli email giriniz",
  }),
  check("password", {
    en: "Password is required",
    tr: "Şifrenizi giriniz",
  }).notEmpty(),
  check("password")
    .isLength({
      min: 6,
    })
    .withMessage({
      en: "Password must be at least  6 characters long",
      tr: "Şifre en az 6 karakterden oluşmalıdır",
    }),
];

exports.validLogin = [
  check("email")
    .isEmail()
    .withMessage({ en: "Invalid email", tr: "Geçersiz email" }),
  check("password", {
    en: "Password is required",
    tr: "Şifrenizi giriniz",
  }).notEmpty(),
  // check("deviceToken", "deviceToken is required").notEmpty(),
  // check("timezone", "timezone is required").notEmpty(),
  check("password")
    .isLength({
      min: 6,
    })
    .withMessage({
      en: "Password must contain at least 6 characters",
      tr: "Şifre en az 6 karakterden oluşmalıdır",
    }),
];

exports.forgotPasswordValidator = [
  check("email").not().isEmpty().isEmail().withMessage({
    en: "Must be a valid email address",
    tr: "Geçerli email giriniz",
  }),
];

exports.resetPasswordValidator = [
  check("newPassword").not().isEmpty().isLength({ min: 6 }).withMessage({
    en: "Password must be at least  6 characters long",
    tr: "Şifre en az 6 karakterden oluşmalıdır",
  }),
];

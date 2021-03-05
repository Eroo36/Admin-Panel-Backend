const { User } = require("../models/user");
const expressJwt = require("express-jwt");
const _ = require("lodash");
const Hogan = require("hogan.js");
const fs = require("fs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const AppleAuth = require("apple-auth");
const passport = require("passport");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const { errorHandler } = require("../helpers/dbErrorHandling");
// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.MAIL_KEY);
const { createTransport } = require("nodemailer");
const sesTransport = require("nodemailer-ses-transport");
var sesTransporter = createTransport(
  sesTransport({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  })
);

// function callback(error, info) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Message sent!");
//   }
// }

/**
 * @swagger
 * path:
 *  /users/register:
 *    post:
 *      summary: Register a new user
 *      tags:
 *        - users
 *      requestBody:
 *        description: Optional description in *Markdown*
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      responses:
 *        "201":
 *          description: Generated new user.
 */

exports.registerController = async (req, res) => {
  const { name, surname, email, password } = req.body;

  const token = crypto.randomBytes(2).toString("hex");
  const activateToken = parseInt(token, 32);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map((error) => error.msg)[0];
    console.log(firstError);
    return res.status(422).json({
      errors: firstError,
    });
  } else {
    User.findOne({
      email,
    }).exec((err, user) => {
      if (user) {
        return res.status(400).json({
          errors: {
            en: "Email is already registered",
            tr: "Bu email ile kaydınız bulunmaktadır",
          },
        });
      } else {
        const newUser = new User({
          name,
          surname,
          email,
          password,
        });
        newUser.save();

        // const emailData = {
        //   from: process.env.SENDER_MAIL,
        //   to: email,
        //   subject:
        //     language == "Turkish"
        //       ? "Hesap aktivasyon linki"
        //       : "Account activation link",
        //   html:
        //     language == "Turkish"
        //       ? compiledTemplate1.render({
        //           content:
        //             "Hesabınızı etkinleştirmek için lütfen aşağıdaki PIN kodunu giriniz.",
        //           token: activateToken,
        //         })
        //       : compiledTemplate.render({
        //           content:
        //             "Please enter the following PIN to activate your account.",
        //           token: activateToken,
        //         }),
        // };

        // sesTransporter.sendMail(emailData, callback);
        res.json({ msg: { en: "Mail Sent!", tr: "Email gönderildi!" } });
      }
    });
  }
};

/**
 * @swagger
 * path:
 *  /users/activation:
 *    post:
 *      summary: Email activation
 *      tags:
 *        - users
 *      requestBody:
 *        description: The code that comes from mail
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                activateToken:
 *                  type: string
 *      responses:
 *        "200":
 *          description: Activation success!
 *        "400":
 *          description: Please fill all fields.
 *        "401":
 *          description: Unauthorized!
 *        "403":
 *          description: Incorrect confirm code!
 */

exports.activationController = async (req, res) => {
  const { activateToken } = req.body;

  const user = await User.findOne({ activateToken });

  if (!user || user.activateToken !== activateToken) {
    res.status(404).send({
      msg: {
        en: "Invalid code, please check your email",
        tr: "Geçersiz aktivasyon kodu, lütfen emailinizi kontrol ediniz",
      },
    });
  }

  try {
    await User.findOneAndUpdate(
      { activateToken },
      {
        $set: { isActive: true },
        // $unset: { activateToken: "" },
      },
      { new: true }
    );

    const payload = {
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: user.password,
        isAdmin: user.isAdmin,
      },
    };
    jwt.sign(payload, process.env.JWT_SECRET_KEY, (err, token) => {
      if (err) throw err;
      res.json({
        msg: {
          en: "Account successfully activated",
          tr: "Hesap başarıyla etkinleştirildi",
        },
        token: token,
      });
    });
  } catch (err) {
    res.status(500).send("internal server error");
  }
};

/**
 * @swagger
 * path:
 *  /users/login:
 *    post:
 *      summary: User login
 *      tags:
 *        - users
 *      requestBody:
 *        description: Optional description in *Markdown*
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *                password:
 *                  type: string
 *                timezone:
 *                  type: string
 *                deviceToken:
 *                  type: string
 *      responses:
 *        "200":
 *          description: User logged in
 *        "400":
 *          description: You can not leave fields empty.
 *        "401":
 *          description: Incorrect Pass
 *        "404":
 *          description: User not found.
 */

exports.signinController = (req, res) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array().map((error) => error.msg)[0];
    console.log(firstError);
    return res.status(422).json({
      errors: firstError,
    });
  } else {
    // check if user exist
    User.findOne({
      email,
    }).exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          errors: {
            en: "User with that email does not exist. Please signup",
            tr: "Bu email ile kayıtlı bir hesap bulunmamaktadır",
          },
        });
      }
      if (!user.authenticate(password)) {
        return res.status(400).json({
          errors: {
            en: " Invalid Email or password",
            tr: "Geçersiz email ya da şifre",
          },
        });
      }
      // generate a token and send to client
      const payload = {
        user: {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          password: user.password,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
        },
      };
      jwt.sign(payload, process.env.JWT_SECRET_KEY, (err, token) => {
        if (err) {
          return res.status(400).json({
            errors: {
              en: "Server error occured",
              tr: "sunucu hatasi",
            },
          });
        }
        res.json({ token });
      });
    });
  }
};

exports.adminMiddleware = (req, res, next) => {
  User.findById({
    _id: req.user._id,
  }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(400).json({
        error: "Admin resource. Access denied.",
      });
    }

    req.profile = user;
    next();
  });
};

/**
 * @swagger
 * path:
 *  /users/forgotpassword:
 *    put:
 *      summary: Forgot password system
 *      tags:
 *        - users
 *      requestBody:
 *        description: Optional description in *Markdown*
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                  format: email
 *      responses:
 *        "200":
 *          description: New password sent.
 *        "400":
 *          description: Please fill all fields.
 *        "403":
 *          description: There is no user found with this e-mail address.
 */

exports.forgotPasswordController = (req, res) => {
  const { email } = req.body;
  const errors = validationResult(req);
  const resetToken = crypto.randomBytes(6).toString("hex");
  const activateToken = parseInt(resetToken, 32);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map((error) => error.msg)[0];
    return res.status(422).json({
      errors: firstError,
    });
  } else {
    User.findOne(
      {
        email,
      },
      (err, user) => {
        if (err || !user) {
          return res.status(400).json({
            error: {
              en: "User with that email does not exist",
              tr: "Bu email ile kayıtlı bir hesap bulunmamaktadır",
            },
          });
        }

        const token = jwt.sign(
          {
            _id: user._id,
          },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "10m",
          }
        );

        // const emailData = {
        //   from: process.env.SENDER_MAIL,
        //   to: email,
        //   subject: `Password Reset link`,
        //   html: compiledTemplate.render({
        //     content: "Here is your new password",
        //     token: activateToken,
        //   }),
        // };

        return user.updateOne(
          {
            resetPasswordCode: activateToken,
          },
          (err, success) => {
            if (err) {
              console.log("RESET PASSWORD LINK ERROR", err);
              return res.status(400).json({
                error: {
                  en:
                    "Database connection error on user password forgot request",
                  tr: "Beklenmedik hata oluştu. Lütfen yeniden deneyiniz.",
                },
              });
            } else {
              try {
                // sesTransporter.sendMail(emailData, callback);
                //await emailTransfer.sendMail(emailInfo);
                res.json({
                  msg: { en: "Mail Sent!", tr: "Email gönderildi!" },
                });
              } catch (err) {
                throw err;
              }
            }
          }
        );
      }
    );
  }
};

/**
 * @swagger
 * path:
 *  /users/resetpassword:
 *    put:
 *      summary: Reset password system
 *      tags:
 *        - users
 *      requestBody:
 *        description: resetPasswordCode is the "code" that you get from mail
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                resetPasswordCode:
 *                  type: string
 *                newPassword:
 *                  type: string
 *      responses:
 *        "200":
 *          description: New password sent.
 *        "400":
 *          description: Please fill all fields.
 *        "403":
 *          description: There is no user found with this e-mail address.
 */

exports.resetPasswordController = async (req, res) => {
  const { newPassword, resetPasswordCode } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map((error) => error.msg)[0];
    return res.status(422).json({
      errors: firstError,
    });
  }

  User.findOne(
    {
      resetPasswordCode,
    },
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: { en: "Invalid code!", tr: "Geçersiz aktivasyon kodu" },
        });
      }

      const updatedFields = {
        password: newPassword,
        resetPasswordCode: "",
      };

      user = _.extend(user, updatedFields);

      user.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: {
              en: "Error resetting user password",
              tr: "Beklenmedik hata oluştu. Lütfen yeniden deneyiniz.",
            },
          });
        }
        res.json({
          msg: {
            en: "Great! Now you can login with your new password",
            tr: "Süper! Şimdi yeni şifren ile giriş yapabilirsin",
          },
        });
      });
    }
  );
};

/**
 * @swagger
 * path:
 *  /users/reactivation:
 *    post:
 *      summary: Reactivation code
 *      tags:
 *        - users
 *      requestBody:
 *        description: reactivation code with mail
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *      responses:
 *        "200":
 *          description: Activation Code sent.
 *        "400":
 *          description: Server Problem.
 *        "403":
 *          description: There is no user found with this e-mail address.
 */

exports.reactivationController = async (req, res) => {
  const { email } = req.body;
  let user = await User.findOne({ email: email });
  try {
    if (user) {
      if (user.activateToken) {
        // const emailData = {
        //   from: process.env.SENDER_MAIL,
        //   to: email,
        //   subject: "Account activation PIN",
        //   html: compiledTemplate.render({
        //     content: "Please enter the following PIN to activate your account.",
        //     token: user.activateToken,
        //   }),
        // };
        // sesTransporter.sendMail(emailData, callback);
        return res
          .status(200)
          .json({ msg: { en: "Mail Sent!", tr: "Email gönderildi!" } });
      } else {
        return res.json({
          msg: {
            en: "This account has already been activated!",
            tr: "Hesap zaten etkinleştirilmiş",
          },
        });
      }
    } else {
      return res.status(403).json({
        msg: {
          en: "There is no user found with this e-mail address",
          tr: "Bu email ile kayıtlı bir hesap bulunmamaktadır",
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      msg: {
        en: "Error resetting user password",
        tr: "Beklenmedik hata oluştu. Lütfen yeniden deneyiniz.",
      },
    });
  }
};

// /**
//  * @swagger
//  * path:
//  *  /users/googlelogin:
//  *    post:
//  *      summary: Google login system
//  *      tags:
//  *        - users
//  *      requestBody:
//  *        description: googlelogin needs a "token" that you get from login link from google
//  *        required: true
//  *        content:
//  *          application/json:
//  *            schema:
//  *              type: object
//  *              properties:
//  *                idToken:
//  *                  type: string
//  *                  format: token
//  *      responses:
//  *        "200":
//  *          description: New password sent.
//  *        "400":
//  *          description: Please fill all fields.
//  *        "403":
//  *          description: There is no user found with this e-mail address.
//  */

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT);
// // Google Login
// exports.googleController = (req, res) => {
//   const { idToken } = req.body;

//   client
//     .verifyIdToken({
//       idToken,
//       audience: process.env.GOOGLE_CLIENT,
//     })
//     .then((response) => {
//       // console.log('GOOGLE LOGIN RESPONSE',response)
//       const {
//         email_verified,
//         given_name,
//         family_name,
//         email,
//         locale,
//       } = response.payload;
//       if (email_verified) {
//         User.findOne({ email }).exec((err, user) => {
//           if (user) {
//             const payload = {
//               user: {
//                 id: user.id,
//                 name: user.name,
//                 surname: user.surname,
//                 email: user.email,
//                 password: user.password,
//                 birthDate: user.birthDate,
//                 height: user.height,
//                 weight: user.weight,
//                 country: user.country,
//                 avatar: user.avatar,
//                 gender: user.gender,
//                 language: user.language,
//                 isAdmin: user.isAdmin,
//                 hasProfile: user.hasProfile,
//               },
//             };
//             const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
//               expiresIn: "7d",
//             });
//             return res.json({
//               token,
//               hasProfile: user.hasProfile,
//               country: locale,
//             });
//           } else {
//             res.json({ null: "null", country: locale });
//           }
//         });
//       } else {
//         return res.status(400).json({
//           error: {
//             en: "Google logi failed, please try again",
//             tr: "Google ile giriş başarısız oldu. Lütfen yeniden deneyiniz.",
//           },
//         });
//       }
//     });
// };

const { User } = require("../models/user");
const expressJwt = require("express-jwt");

// /**
//  * @swagger
//  * path:
//  *  users/:id:
//  *    get:
//  *      summary: Get User Info
//  *      parameters:
//  *        - in: query
//  *          name: userId
//  *          schema:
//  *            type: string
//  *          description: Put user id here
//  *      tags:
//  *        - users
//  *      responses:
//  *        "401":
//  *          description: Invalid token.
//  *        "404":
//  *          description: User not found.
//  */

// exports.readController = (req, res) => {
//   const userId = req.params.id;
//   console.log(userId);
//   User.findById(userId).exec((err, user) => {
//     if (err || !user) {
//       console.log(err);
//       return res.status(400).json({
//         error: "User not found",
//       });
//     }
//     user.hashed_password = undefined;
//     user.salt = undefined;
//     res.json(user);
//   });
// };

/**
 * @swagger
 * path:
 *  users/update:
 *    put:
 *      summary: Get User Info
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          schema:
 *            type: string
 *          description: Put user token here
 *      tags:
 *        - users
 *      requestBody:
 *        description: Things to update in user ( Only name and password for now )
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                surname:
 *                  type: string
 *                avatar:
 *                  type: string
 *                password:
 *                  type: string
 *      responses:
 *        "401":
 *          description: Invalid token.
 *        "404":
 *          description: User not found.
 */

exports.updateController = (req, res) => {
  // console.log('UPDATE USER - req.user', req.user, 'UPDATE DATA', req.body);
  const { name, surname, password, oldPassword, email, avatar } = req.body;
  console.log(req.body);
  User.findOne({ _id: req.user.id }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    if (name) user.name = name;

    if (surname) user.surname = surname;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          msg: {
            en: "Password must contain at least 6 characters",
            tr: "Şifre en az 6 karakterden oluşmalıdır",
          },
        });
      } else if (oldPassword && !user.authenticate(oldPassword)) {
        return res.status(400).json({
          errors: {
            en: " Invalid old password",
            tr: " Eski şifreniz geçersiz",
          },
        });
      } else {
        user.password = password;

        console.log("in first cond", user.password);
      }
      // User.findOne({
      //   email,
      // }).exec((err, user) => {
      //   if (err || !user) {
      //     return res.status(400).json({
      //       errors: {en:"User with that email does not exist. Please signup",tr:"Bu email ile kayıtlı bir hesap bulunmamaktadır"},
      //     });
      //   }

      //   // generate a token and send to client

      // })
    }
    console.log("in last cond", user.password);
    if (avatar) user.avatar = avatar;

    user.save((err, updatedUser) => {
      if (err) {
        console.log("USER UPDATE ERROR", err);
        return res.status(400).json({
          msg: {
            en: "Update failed. Please try again later",
            tr: "Bilgiler güncellenemedi. Lütfen daha sonra tekrar deneyiniz",
          },
        });
      }
      updatedUser.hashed_password = undefined;
      console.log("after saving ", updatedUser.password);
      updatedUser.salt = undefined;
      res.json({
        updatedUser,
        msg: {
          msg: {
            en: "You have successfully updated your profile",
            tr: "Bilgileriniz güncellendi",
          },
        },
      });
    });
  });
};

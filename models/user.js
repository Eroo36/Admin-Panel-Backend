/**
 * @swagger
 *  components:
 *    schemas:
 *      User:
 *        type: object
 *        required:
 *          - name
 *          - surname
 *          - email
 *          - password
 *          - birthDate
 *          - height
 *          - weight
 *          - country
 *          - gender
 *          - timezone
 *          - deviceToken
 *          - privacyChecked
 *          - termsChecked
 *        properties:
 *          name:
 *            type: string
 *          surname:
 *            type: string
 *          email:
 *            type: string
 *            format: email
 *          password:
 *            type: string
 *          birthDate:
 *            type: string
 *          height:
 *            type: number
 *          weight:
 *            type: number
 *          country:
 *            type: string
 *          deviceToken:
 *            type: string
 *          timezone:
 *            type: string
 *          gender:
 *            type: string
 *            enum:
 *              - Male
 *              - Female
 *          privacyChecked:
 *            type: boolean
 *          termsChecked:
 *            type: boolean
 *
 */

import { model, Schema } from "mongoose";
import crypto from "crypto";

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
      required: true,
    },
    surname: {
      type: String,
      trim: true,
      default: "",
      required: true,
    },
    salt: String,
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    hash_password: {
      type: String,
      required: true,
    },
    resetPasswordCode: {
      type: Number,
      default: "",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: { type: Boolean, default: false },
    activateToken: { type: String },
  },

  {
    timestamps: true,
  }
);

// virtual
userSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();

    this.hash_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

// methods
userSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hash_password;
  },

  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },

  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};

const User = model("User", userSchema);
module.exports.User = User;

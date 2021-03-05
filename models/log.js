import { model, Schema } from "mongoose";

const logSchema = new Schema(
  {
    type: { type: String },
  },
  {
    timestamps: true,
  }
);

const Log = model("Log", logSchema);
module.exports.Log = Log;

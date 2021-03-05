const cors = require("cors");
const morgan = require("morgan");
module.exports = function (app) {
  if (process.env.NODE_ENV === "development" || "production") {
    app.use(cors());
  }
};

const express = require("express");
const winston = require("winston");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const moment = require("moment-timezone");
const bodyParser = require("body-parser");
const cors = require("cors");
// const path = require("path");
const dotenv = require("dotenv");
const http = require("http");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { swaggerConfig } = require("./config");
const specs = swaggerJsdoc(swaggerConfig);
const app = express();
const server = http.createServer(app);
const auth = require("./routes/auth.js");
const test = require("./routes/test.js");

const { default: connectDB } = require("./config/db");

app.use(bodyParser.json());
app.use(mongoSanitize());
connectDB();

moment.tz.setDefault("Europe/Istanbul");

// prevent parameter polution
app.use(hpp());
require("./startup/logging")();
require("./startup/cors")(app);
require("./startup/helmet")(app);
dotenv.config({ path: ".env" });
app.use(express.static("assets"));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
  );
  next();
});

app.use("/users", auth);
app.use("/test", test);

app.get(
  "/docs",
  swaggerUi.setup(specs, {
    explorer: true,
  })
);

const PORT = process.env.PORT || 2001; // Run server

server.listen(PORT, () => winston.info(`Server is running on ${PORT}`)); // Run server

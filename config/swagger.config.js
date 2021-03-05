export default {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API",
      version: "1.0.0",
      description: "API",
      license: {
        name: "Unknown",
        url: "https://choosealicense.com/licenses/mit/",
      },
    },
    servers: [
      {
        url: "http://localhost:2001/",
      },
    ],
  },
  apis: [
    "./models/*",
    "./routes/*",
    "./controllers/user/*",
    "./controllers/auth.controller.js",
    "./controllers/user.controller.js",
    "./controllers/level/*",
    "./controllers/question/*",
    "./routes/*",
    "./server.js",
    "./data.js",
  ],
};

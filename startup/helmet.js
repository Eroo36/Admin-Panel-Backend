const helmet = require('helmet');
const compression = require('compression');

module.exports = function (app) {
    app.use(helmet.hidePoweredBy());
    app.use(helmet());
    app.use(compression());
}
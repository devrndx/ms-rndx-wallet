// eslint-disable global-require
const path = require('path');
const helmet = require('helmet');
const log = require('metalogger')();
const healthcheck = require('maikai');
const hbs = require('hbs');
const cors = require('cors');

require('app-module-path').addPath(path.join(__dirname, '/lib'));
const webSocket = require("./lib/wallet/controllers/socket");

// Add all routes and route-handlers for your service/app here:
function serviceRoutes(app) {

    // For Liveness Probe, defaults may be all you need.
    const livenessCheck = healthcheck({ "path": "/ping" });
    app.use(livenessCheck.express());

    // For readiness check, let's also test the DB
    const check = healthcheck();
    const AdvancedHealthcheckers = require('healthchecks-advanced');
    const advCheckers = new AdvancedHealthcheckers();
    // Database health check is cached for 10000ms = 10 seconds!
    check.addCheck('db', 'dbQuery', advCheckers.dbCheck, { minCacheMs: 10000 });
    app.use(check.express());

    /* eslint-disable global-require */

    // Temporary allow all urls
    const safesitelist =
        process.env.NODE_ENV == "production" ? [
            "https://rndx-wallet.io",
            "https://app.rndx-wallet.io",
            "https://admin.rndx-wallet.io",
        ] : [
            "http://localhost:38777",
            "https://dev.rndx-wallet.io",
            "https://app.dev.rndx-wallet.io",
            "https://admin.dev.rndx-wallet.io",
        ];

    const corsOptions = {
        origin: function(origin, callback) {
            const issafesitelisted = safesitelist.indexOf(origin) !== -1;
            callback(null, issafesitelisted);
        },
        credentials: true
    };

    app.use(cors(corsOptions));
    app.use("/wallet", require("wallet")); // attach to sub-route

    webSocket(app.http, app);
    /* eslint-enable global-require */
}

function setupErrorHandling(app) {
    // Custom formatting for error responses.
    app.use((err, req, res, next) => {
        if (err) {
            const out = {};
            if (err.isJoi || err.type === "validation") { //validation error. No need to log these
                out.errors = err.details;
                res.status(400).json(out);
                return;
            } else {
                log.error(err);
                if (process.env.NODE_ENV === "production") {
                    out.errors = ["Internal server error"];
                } else {
                    out.errors = [err.toString()];
                }
                res.status(500).json(out);
                return;
            }
        }
        return next();
    });
}

exports.setup = function(app, callback) {
    // Choose your favorite view engine(s)
    app.set('view engine', 'handlebars');
    app.engine('handlebars', hbs.__express);

    /** Adding security best-practices middleware
     * see: https://www.npmjs.com/package/helmet **/
    app.use(helmet());

    //---- Mounting well-encapsulated application modules (so-called: "mini-apps")
    //---- See: http://expressjs.com/guide/routing.html and http://vimeo.com/56166857
    serviceRoutes(app);

    setupErrorHandling(app);

    // If you need websockets:
    // let socketio = require('socket.io')(runningApp.http);
    // require('fauxchatapp')(socketio);

    if (typeof callback === 'function') {
        callback(app);
        return;
    }
};
/* jshint -W079 */
const Promise = require('bluebird'),
    config = require('config'),
    log = require('metalogger')(),
    representor = require('kokua'),
    _ = require('lodash');

const Wallet = require("wallet/models/wallet");
const actions = {},
    model = new Wallet();

const responseMediaType = 'application/hal+json';

actions.getWallet = async function(req, res, next) {

    let userRows = {};
    try {
        userRows = await model.getWallet();
    } catch (err) {
        let msg = "Database Error: " + err.message;
        if (err.message.match(/ER_NO_SUCH_TABLE/)) {
            msg = "Database hasn't been set up. Please run: `make migrate`";
        }
        return res.status(500).send(msg);
    }

    let response = {};
    response.wallet = userRows;
    response["h:ref"] = {
        "self": "/wallet"
    };

    // Render internal representation into proper HAL+JSON
    response = representor(response, responseMediaType);

    res.set('Content-Type', responseMediaType)
        .status(200)
        .json(response);

};

module.exports = actions;
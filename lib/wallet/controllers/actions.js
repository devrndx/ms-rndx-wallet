/* jshint -W079 */
const Promise = require('bluebird'),
    config = require('config'),
    log = require('metalogger')(),
    representor = require('kokua'),
    _ = require('lodash');


const Caver = require('caver-js');
const Wallet = require("wallet/models/wallet");
const actions = {},
    model = new Wallet();
const AUTH_INFO = {
    accessKeyId: 'KASKXRUESMYBQFUQ64PE0XGH',
    secretAccessKey: 'lDbI1NTJ1xaLnxlTYXiuXhJNSL-GYaOYhyMeoijS',
};

const option = {
    headers: [{
            name: 'Authorization',
            value: 'Basic ' +
                Buffer.from(
                    AUTH_INFO.accessKeyId + ':' + AUTH_INFO.secretAccessKey
                ).toString('base64'),
        },
        {
            name: 'x-chain-id',
            value: process.env.NODE_ENV === 'production' ? '8217' : '1001',
        },
    ],
};

const cav = new Caver(
    new Caver.providers.HttpProvider(
        'https://node-api.klaytnapi.com/v1/klaytn',
        option
    )
);

const rndxAbi = require('../constants/roundxContract');
const rndxAddr = '0x941a9e50b8e07a8a4b1f68a91e1ea4004db6b80f';

const responseMediaType = 'application/hal+json';

const contract = new cav.klay.Contract(rndxAbi, rndxAddr);

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

actions.createAccount = async function(req, res, next) {
    const userId = "rndxUser";
    const userPw = makeid(8);
    const authenticate = "rndxSecret";

    const newAccount = await cav.klay.accounts.create(userId, userPw, authenticate);
    await model.saveWallet(userId, userPw, newAccount.address, newAccount.privateKey);

    let response = { status: "ok" };
    response.addr = newAccount.address;
    response.pk = newAccount.privateKey;

    response["h:ref"] = {
        "self": "/wallet/create_account"
    };

    response = representor(response, responseMediaType);

    res.set('Content-Type', responseMediaType)
        .status(200)
        .json(response);
};

actions.balanceof = async function(req, res, next) {
    let response = { status: "ok" };

    response["h:ref"] = {
        "self": "/wallet/balanceof"
    };

    const balance = await contract.methods.balanceOf(req.query.addr).call();

    response.balance = parseUnit(balance, -18);
    response = representor(response, responseMediaType);

    res.set('Content-Type', responseMediaType)
        .status(200)
        .json(response);
};


async function parseUnit(amount, decimal) {
    const result = decimal > 0 ? cav.utils.toBN(10 ** decimal).mul(cav.utils.toBN(Math.floor(amount))).toString() : cav.utils.toBN(Math.floor(amount / (10 ** -decimal))).toString();
    return result;
}

async function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

module.exports = actions;
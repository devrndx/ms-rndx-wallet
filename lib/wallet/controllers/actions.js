/* jshint -W079 */
const Promise = require("bluebird"),
    config = require("config"),
    log = require("metalogger")(),
    representor = require("kokua"),
    _ = require("lodash");

const Caver = require("caver-js");

const Wallet = require("wallet/models/wallet");
const ContractService = require("wallet/services/contractServices");

const actions = {},
    model = new Wallet();

const contractService = new ContractService();

// const socket = require("./socket");
// const cavExt = new Caver("8217", AUTH_INFO.accessKeyId, AUTH_INFO.secretAccessKey);
// cavExt.initKIP7API("8217", AUTH_INFO.accessKeyId, AUTH_INFO.secretAccessKey);

const responseMediaType = "application/hal+json";

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
        self: "/wallet",
    };

    // Render internal representation into proper HAL+JSON
    response = representor(response, responseMediaType);

    res.set("Content-Type", responseMediaType).status(200).json(response);
};

actions.createAccount = async function(req, res, next) {
    const userId = "httUser";
    const userPw = makeid(8);
    const authenticate = "httSecret";

    const newAccount = await contractService.createAccount(
        userId,
        userPw,
        authenticate
    );

    await model.saveWallet(
        userId,
        userPw,
        newAccount.address,
        newAccount.privateKey
    );

    let response = { status: "ok" };
    response.addr = newAccount.address;
    response.pk = newAccount.privateKey;

    response["h:ref"] = {
        self: "/wallet/create_account",
    };

    response = representor(response, responseMediaType);

    res.set("Content-Type", responseMediaType).status(200).json(response);
};

actions.balanceof = async function(req, res, next) {
    let response = { status: "ok" };

    response["h:ref"] = {
        self: "/wallet/balanceof",
    };
    try {
        const address = req.query.addr;
        log.info(address);

        const balance = await contractService.balanceOf(address);

        log.info(`Wallet Balance is ${balance}`);

        response.balance = balance;
        response = representor(response, responseMediaType);

        res.set("Content-Type", responseMediaType).status(200).json(response);
    } catch (err) {
        const msg = "KAS Error: " + err.message;
        log.error(err.message);
        log.error(err.stack);

        return res.status(200).send(msg);
    }
};

actions.transferAdmin = async function(req, res, next) {
    const pk = req.body.pk;
    const toAddr = req.body.toAddr;
    const amount = req.body.amount;
    const nameVal = req.body.name;
    const phoneNumVal = req.body.phoneNum;

    log.info("======================================");
    log.info("PK :" + pk);
    log.info("toAddr :" + toAddr);
    log.info("amount :" + amount);
    log.info("nameVal :" + nameVal);
    log.info("phoneNumVal :" + phoneNumVal);
    log.info("======================================");

    const isExist = await model.isExistWallet(toAddr);
    if (!isExist) {
        const msg = "isNotExist:" + "-" + ":" + toAddr + ":3";
        log.info(msg);
        req.app.get("io").emit("TxStateChanged", msg);

        const response = { status: "isNotExistWallet" };
        res.status(200).json(response);
        return;
    }

    contractService.getAccount(pk)
        .then((ownerAcnt) => {
            return contractService.transfer(ownerAcnt, toAddr, amount);
        })
        .then(async(receipt) => {
            const msg = "Done:" + receipt.transactionHash + ":" + toAddr + ":0";
            log.info(msg);
            req.app.get("io").emit("TxStateChanged", msg);
        })
        .catch((error) => {
            log.error(error.message);
        });
    contractService.getAccount(pk)
        .then((ownerAcnt) => {
            return contractService.lockWallet(ownerAcnt, toAddr);
        })
        .catch((error) => {
            log.error(error.message);
        });

    const response = { status: "ok" };
    res.status(200).json(response);
};

actions.lockWallet = async function(req, res, next) {
    const pk = req.body.pk;
    const toAddr = req.body.toAddr;

    const ownerAcnt = await cav.klay.accounts.privateKeyToAccount(pk);
    await contractService.lockWallet(ownerAcnt, toAddr);

    let response = { status: "ok" };

    response["h:ref"] = {
        self: "/wallet/lockWallet",
    };
    response = representor(response, responseMediaType);

    res.set("Content-Type", responseMediaType).status(200).json(response);
};

function genSocketMsg(status, txHash, addr, pk, balance, result) {
    const msg = `${status}:${txHash}:${addr}:${pk}:${balance.toString()}:${result.toString()}`;
    log.info(msg);
    return msg;
}

function makeid(length) {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = actions;


// .once("transactionHash", (txHash) => {

//         return;
//     })
//     .once("receipt", (receipt) => {
//         log.info(receipt);
//         const toAddr = req.body.toAddr;

//         if (receipt.status === false) {
//             const msg = "Reverted:" + receipt.transactionHash + ":" + toAddr + ":1";
//             req.app.get("io").emit("TxStateChanged", msg);
//             return;
//         }

//         const msg = "Done:" + receipt.transactionHash + ":" + toAddr + ":0";
//         log.info(msg);

//         req.app.get("io").emit("TxStateChanged", msg);
//         return;
//     })
//     .catch((error) => {
//         log.info(error.message);
//         const msg = "Retry:" + "-" + ":" + toAddr + ":2";
//         req.app.get("io").emit("TxStateChanged", msg);
//         return;
//     });
/* jshint -W079 */
const Promise = require("bluebird"),
    config = require("config"),
    log = require("metalogger")(),
    representor = require("kokua"),
    _ = require("lodash");

const Caver = require("caver-js");

const Wallet = require("wallet/models/wallet");
const actions = {},
    model = new Wallet();
const AUTH_INFO = {
    accessKeyId: "KASKXRUESMYBQFUQ64PE0XGH",
    secretAccessKey: "lDbI1NTJ1xaLnxlTYXiuXhJNSL-GYaOYhyMeoijS",
};

// const socket = require("./socket");

const option = {
    headers: [{
            name: "Authorization",
            value: "Basic " +
                Buffer.from(
                    AUTH_INFO.accessKeyId + ":" + AUTH_INFO.secretAccessKey
                ).toString("base64"),
        },
        {
            name: "x-chain-id",
            // value: process.env.NODE_ENV === "production" ? "8217" : "1001",
            value: "8217",
        },
    ],
};

const cav = new Caver(
    new Caver.providers.HttpProvider(
        "https://node-api.klaytnapi.com/v1/klaytn",
        option
    )
);
const FEE_DELIGATE_ADDRESS = "0x2Fd7091166085bB938bD81Af848D65f8CD581456";

// const cavExt = new Caver("8217", AUTH_INFO.accessKeyId, AUTH_INFO.secretAccessKey);
// cavExt.initKIP7API("8217", AUTH_INFO.accessKeyId, AUTH_INFO.secretAccessKey);

const rndxAbi = require("../constants/roundxContract");
const rndxAddr = "0x941a9e50b8e07a8a4b1f68a91e1ea4004db6b80f";
const GAS_LIMIT = 3000000;
const responseMediaType = "application/hal+json";

const KIP7 = new cav.kct.kip7(rndxAddr);

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
        self: "/wallet",
    };

    // Render internal representation into proper HAL+JSON
    response = representor(response, responseMediaType);

    res.set("Content-Type", responseMediaType).status(200).json(response);
};

actions.createAccount = async function(req, res, next) {
    const userId = "rndxUser";
    const userPw = makeid(8);
    const authenticate = "rndxSecret";

    const newAccount = await cav.klay.accounts.create(
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

        const balance = await contract.methods.balanceOf(address).call();

        log.info(`Wallet Balance is ${balance}`);

        response.balance = parseUnit(balance, -18);
        response = representor(response, responseMediaType);

        res.set("Content-Type", responseMediaType).status(200).json(response);
    } catch (err) {
        let msg = "KAS Error: " + err.message;
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

    const account = await cav.klay.accounts.privateKeyToAccount(pk);
    let nonce = await cav.klay.getTransactionCount(account.address);

    const encodeABI = await contract.methods
        .transfer(toAddr, parseUnit(amount, 18))
        .encodeABI();

    const signedTx = await cav.klay.accounts.signTransaction({
            type: 'FEE_DELEGATED_SMART_CONTRACT_EXECUTION',
            from: account.address,
            to: rndxAddr,
            data: encodeABI,
            gas: GAS_LIMIT,
            value: 0

            // gasPrice: gasPriceMore.numberToHex(),
        },
        account.privateKey
    );
    log.info("======================================");
    log.info("PK :" + pk);
    log.info("toAddr :" + toAddr);
    log.info("amount :" + parseUnit(amount, 18));
    log.info("nameVal :" + nameVal);
    log.info("phoneNumVal :" + phoneNumVal);
    log.info("address :" + account.address);
    log.info("nonce :" + nonce);

    log.info("======================================");
    await cav.klay
        .sendTransaction({
            senderRawTransaction: signedTx,
            feePayer: FEE_DELIGATE_ADDRESS,
            // legacyKey: true,
        })
        .once("transactionHash", (txHash) => {
            const toAddr = req.body.toAddr;
            const msg = "Pending:" + txHash + ":" + toAddr + ":0";
            log.info(msg);
            req.app.get("io").emit("TxStateChanged", msg);
            return;
        })
        .once("receipt", (receipt) => {
            log.info(receipt);
            const toAddr = req.body.toAddr;

            if (receipt.status === false) {
                const msg = "Reverted:" + receipt.transactionHash + ":" + toAddr + ":1";
                req.app.get("io").emit("TxStateChanged", msg);
                return;
            }

            const msg = "Done:" + receipt.transactionHash + ":" + toAddr + ":0";
            log.info(msg);

            req.app.get("io").emit("TxStateChanged", msg);
            return;
        })
        .once("error", log.error)
        .catch((error) => {
            log.info(error.message);
            const msg = "Retry:" + "-" + ":" + toAddr + ":2";
            req.app.get("io").emit("TxStateChanged", msg);
            return;
        });
    const response = { status: "ok" };
    res.status(200).json(response);
};

function parseUnit(amount, decimal) {
    const result =
        decimal > 0 ?
        cav.utils
        .toBN(10 ** decimal)
        .mul(cav.utils.toBN(Math.floor(amount)))
        .toString() :
        cav.utils.toBN(Math.floor(amount / 10 ** -decimal)).toString();
    return result;
}

async function makeid(length) {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function genSocketMsg(status, txHash, addr, pk, balance, result) {
    const msg = `
                $ { status }: $ { txHash }: $ { addr }: $ { pk }: $ { balance.toString() }: $ { result.toString() }
                `;
    log.info(msg);
    return msg;
}

module.exports = actions;
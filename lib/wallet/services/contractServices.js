/* jshint -W079 */
const Promise = require("bluebird"),
    config = require("config"),
    log = require("metalogger")(),
    representor = require("kokua"),
    _ = require("lodash");

const { reject } = require("bluebird");
const Caver = require("caver-js");
const retry = require("retry");
const delay = require("delay");

// const socket = require("./socket");

class ContractService {
    constructor() {
        const AUTH_INFO = {
            accessKeyId: process.env.KAS_ACCESSKEY,
            secretAccessKey: process.env.KAS_ACCESSSECRET,
        };

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
                    value: process.env.NODE_ENV === "production" ? "8217" : "1001",
                },
            ],
        };

        const rndxAbi = require("../constants/roundxContract");
        this.rndxAddr =
            process.env.NODE_ENV === "production" ?
            "0xFf1Bf7a212012ee903fBb5a3adB4A9a31f371EF7" :
            "0x8a0ad7b5d5fc3aff47b0016b83830a81f9b84a6e";

        this.cav = new Caver(
            new Caver.providers.HttpProvider(
                "https://node-api.klaytnapi.com/v1/klaytn",
                option
            )
        );
        this.GAS_LIMIT = 3000000;
        this.KIP7Cont = new this.cav.klay.KIP7(this.rndxAddr);
        this.contract = new this.cav.klay.Contract(rndxAbi, this.rndxAddr);
    }

    async totalSupply() {
        const initialSupply = await this.KIP7Cont.totalSupply();
        return this.parseUnit(initialSupply, -18);
    }

    async symbol() {
        return await this.KIP7Cont.symbol();
    }

    async balanceOf(address) {
        const balance = await this.KIP7Cont.balanceOf(address);
        return this.parseUnit(balance, -18);
    }

    async getAccount(pk) {
        const tAcnt = await this.cav.klay.accounts.privateKeyToAccount(pk);
        const account = this.cav.klay.accounts.wallet.getAccount(tAcnt.address);

        if (account == undefined) {
            return this.cav.klay.accounts.wallet.add(pk);
        }

        return account;
    }

    async isLocked(address) {
        return await this.contract.methods.lockedList(address).call();
    }

    transfer(ownerAcnt, toAddr, amount) {
        const cAmt = this.parseUnit(amount, 18);
        // return this.contract.transfer(toAddr, cAmt, { from: ownerAcnt.address });
        const operation = retry.operation();
        return new Promise((resolve, reject) => {
            operation.attempt(function(currentAttempt) {
                this.KIP7Cont.transfer(toAddr, cAmt, { from: ownerAcnt.address })
                    .then((receipt) => {
                        resolve(receipt);
                    }).catch((error) => {
                        if (operation.retry(error)) {
                            return;
                        }
                    });
            }.bind(this));
        });
    }

    async lockWallet(ownerAccount, targetAddress) {
        const isLocked = await this.isLocked(targetAddress);
        if (isLocked == false) {
            const encodedAbi = await this.contract.methods
                .SetLockAddress(targetAddress)
                .encodeABI();
            const receipt = await this.cav.klay.sendTransaction({
                    type: "SMART_CONTRACT_EXECUTION",
                    from: ownerAccount.address,
                    to: this.rndxAddr,
                    data: encodedAbi,
                    gas: this.GAS_LIMIT,
                    value: 0
                        // gasPrice: gasPriceMore.numberToHex(),
                },
                ownerAccount.privateKey
            );

            return receipt;
        }

        return undefined;
    }

    parseUnit(amount, decimal) {
        const result =
            decimal > 0 ?
            this.cav.utils
            .toBN(10 ** decimal)
            .mul(this.cav.utils.toBN(Math.floor(amount)))
            .toString() :
            this.cav.utils.toBN(Math.floor(amount / 10 ** -decimal)).toString();
        return result;
    }
}

module.exports = ContractService;

// const encodeABI = this.getTransferAbi(toAddr, this.parseUnit(amount, 18));

// let nonce = await this.cav.klay.getTransactionCount(ownerAcnt.address);
// log.info(`Nonce is ${nonce}`);

// return await this.cav.klay.sendTransaction({
//             type: "SMART_CONTRACT_EXECUTION",
//             from: ownerAcnt.address,
//             to: this.rndxAddr,
//             data: encodeABI,
//             gas: this.GAS_LIMIT,
//             value: 0,
//             nonce: nonce++,

//             // gasPrice: gasPriceMore.numberToHex(),
//         },
//         ownerAcnt.privateKey
//     )
//     .then((receipt) => {
//         log.info(`Owner address : ${ownerAcnt.address}`);
//         log.info(receipt);
//     })
//     .catch((error) => {
//         log.error(error.message);
//     });

// log.info("Before");
// return await this.cav.klay.sendTransaction({
//     senderRawTransaction: senderRawTransaction,
//     // feePayer: ownerAcnt.address,
//     // legacyKey: true,
//     nonce: nonce++,
// }).then((receipt) => {
//     log.info(receipt.transactionHash);
// }).catch((error) => {
//     log.error(error.message);
// });
// }

// sendTxByFeeDeligator(ownerAcnt, encodedAbi) {
//     const operation = retry.operation();

//     return new Promise((resolve, reject) => {
//         operation.attempt(async function(currentAttempt) {
//             let nonce = await this.cav.klay.getTransactionCount(ownerAcnt.address);
//             log.info(`Nonce is ${nonce}`);

//             const signedTx = await this.cav.klay.accounts.signTransaction({
//                     type: "SMART_CONTRACT_EXECUTION",
//                     from: ownerAcnt.address,
//                     to: this.rndxAddr,
//                     data: encodedAbi,
//                     gas: this.GAS_LIMIT,
//                     value: 0,

//                     // gasPrice: gasPriceMore.numberToHex(),
//                 },
//                 ownerAcnt.privateKey
//             );

//             this.cav.klay.sendTransaction({
//                 senderRawTransaction: signedTx,
//                 feePayer: ownerAcnt.address,
//                 // legacyKey: true,
//                 nonce: nonce++,
//             }).then((receipt) => {
//                 resolve(receipt);
//             }).catch(() => {
//                 reject(operation.mainError);
//             });
//         });
//     });
// }
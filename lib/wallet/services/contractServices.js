/* jshint -W079 */
const Promise = require("bluebird"),
    config = require("config"),
    log = require("metalogger")(),
    representor = require("kokua"),
    _ = require("lodash");

const { reject } = require("bluebird");
const Caver = require("caver-js");
const retry = require("retry");

// const socket = require("./socket");

class ContractService {
    constructor() {
        const AUTH_INFO = {
            accessKeyId: "KASKXRUESMYBQFUQ64PE0XGH",
            secretAccessKey: "lDbI1NTJ1xaLnxlTYXiuXhJNSL-GYaOYhyMeoijS",
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
                    // value: process.env.NODE_ENV === "production" ? "8217" : "1001",
                    value: "8217",
                },
            ],
        };

        const rndxAbi = require("../constants/roundxContract");
        this.rndxAddr = "0xFf1Bf7a212012ee903fBb5a3adB4A9a31f371EF7";

        this.cav = new Caver(
            new Caver.providers.HttpProvider(
                "https://node-api.klaytnapi.com/v1/klaytn",
                option
            )
        );
        this.GAS_LIMIT = 3000000;
        this.contract = new this.cav.klay.Contract(rndxAbi, this.rndxAddr);
    }

    async balanceOf(address) {
        const balance = await this.contract.methods.balanceOf(address).call();
        return this.parseUnit(balance, -18);
    }

    async isLocked(address) {
        return await this.contract.methods.lockedList(address).call();
    }

    async lockWallet(ownerAccount, targetAddress) {
        if (isLocked == false) {
            const encodedAbi = await this.contract.methods
                .SetLockAddress(targetAddress)
                .encodeABI();
            return await sendTxByFeeDeligator(ownerAccount, encodedAbi);
        }

        return undefined;
    }

    async sendTxByFeeDeligator(ownerAcnt, encodedAbi) {
        const operation = retry.operation();

        return new Promise((resolve, reject) => {
            operation.attempt(async function(currentAttempt) {
                let nonce = await this.cav.klay.getTransactionCount(ownerAcnt.address);

                const signedTx = await this.cav.klay.accounts.signTransaction({
                        type: "SMART_CONTRACT_EXECUTION",
                        from: ownerAcnt.address,
                        to: this.rndxAddr,
                        data: encodedAbi,
                        gas: GAS_LIMIT,
                        value: 0,

                        // gasPrice: gasPriceMore.numberToHex(),
                    },
                    account.privateKey
                );
                const result = await this.cav.klay.sendTransaction({
                    senderRawTransaction: signedTx,
                    // feePayer: FEE_DELIGATE_ADDRESS,
                    // legacyKey: true,
                    nonce: nonce++,
                });

                if (result != null) {
                    resolve(result);
                } else {
                    reject(operation.mainError);
                }
            });
        });
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
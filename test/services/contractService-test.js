const request = require("supertest");
const assert = require("chai").assert;
const sinon = require("sinon");
const fh = require("../support/fixture-helper.js");
const log = require("metalogger")();

const ContractService = require("wallet/services/contractServices");

describe("contract service test", () => {
    const testService = new ContractService();
    const testPk = process.env.OWNER_PRIV_KEY;
    const testFromPk = process.env.TEST_PRIV_KEY;
    const testFeeDelegate = process.env.FEE_DELEGATE_PRIV_KEY;
    const testOwner = "0x119a593af04a29ed65aa334c1deb8ed5ad188e2d";
    const testAddrs = [
        "0x5b7171534bd972951cf39ba93e49f88595e508ff",
        "0xfef53d325656d035042c72c2b60e322f923dbc62",
        "0x3dc7ec9ef47703663f28c31727c1068bcf19db37",
        "0xb7edab3d97f6cf656fe989f4918c36bd30aa6662",
    ];

    it("Contract Service Check Initial Supply", () => {
        return testService.totalSupply()
            .then((balance) => {
                assert.equal(balance, 20000000000);
            });
    });

    it("Contract Service Check Symbol", () => {
        return testService.symbol()
            .then((symbol) => {
                assert.equal(symbol, "RNDX");
            });
    });

    it("Contract Service Get Account", () => {
        return testService.getAccount(testPk)
            .then((acnt) => {
                assert.equal(acnt.address, testOwner, `acnt Address is ${testPk}`);
            });
    });

    it("Contract Service - Transfer Token Test", () => {
        return testService.getAccount(testPk)
            .then((ownerAcnt) => {
                return testService.transfer(ownerAcnt, testAddrs[0], 500);
            }).then((receipt) => {
                log.info(receipt.transactionHash);
            })
            .catch((error) => {
                assert.fail(`Failed Test :: ${error.message} ${error.stack}`);
            });
    });

    it("Contract Service - Approve Token Test", () => {
        return testService.getAccount(testFromPk)
            .then(async(ownerAcnt) => {
                const amount = await testService.totalSupply();
                return testService.approve(ownerAcnt, testAddrs[0], amount);
            }).then((receipt) => {
                log.info(receipt.transactionHash);
            })
            .catch((error) => {
                assert.fail(`Failed Test :: ${error.message} ${error.stack}`);
            });
    });


    it("Contract Service - Transfer From Token Test", () => {
        return testService.getAccount(testFeeDelegate)
            .then((ownerAcnt) => {
                const amount = 500;
                return testService.transferFrom(ownerAcnt, testAddrs[1], ownerAcnt.address, amount);
            }).then((receipt) => {
                log.info(receipt.transactionHash);
            })
            .catch((error) => {
                assert.fail(`Failed Test :: ${error.message} ${error.stack}`);
            });
    });

    it("Contract Service - UnLock wallet test", () => {
        return testService.unlockWallet(testAddrs[1])
            .then((receipt) => {
                log.info("In Lock Callback");
                log.info(`receipt is ${receipt}`);
                if (receipt === undefined) {
                    return;
                }
                log.info(receipt.transactionHash);
            })
            .catch((error) => {
                assert.fail(`Failed Test :: ${error.message} ${error.stack}`);
            });
    });

    // it("Contract Service - Transfer Token Test", () => {
    //     testService.getAccount(testPk)
    //         .then((owner) => {
    //             assert.equal(owner.address, testOwner);

    //             return owner;
    //         })
    //         .then((ownerAcnt) => {
    //             const testAddr = testAddrs[0];
    //             const testAmount = 500;
    //             log.info(ownerAcnt.address);
    //             return testService.transfer(ownerAcnt, testAddr, testAmount)
    //                 .then((receipt) => {
    //                     log.info(receipt.transactionHash);
    //                     assert.equal(true, true);
    //                 });
    //         })
    //         .catch(() => {
    //             assert.equal(false, true);
    //         });
    // });
});
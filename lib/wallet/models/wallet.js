const db = require("datastore");
const log = require('metalogger')();
const Promise = require('bluebird');

class Wallet {

    async getWallet() {
        const conn = await db.conn();
        let wallet = [{}];
        if (conn) {
            wallet = await conn.query('select `uuid`, `last_updated`, `walletAddr` from wallet');
        }
        return wallet;
    }

    async saveWallet(userId, userPw, walletAddr, pk) {
        const conn = await db.conn();

        if (conn) {
            const insertValue = {
                userId: userId,
                userPw: userPw,
                walletAddr: walletAddr,
                privateKey: pk
            };
            await conn.query("INSERT INTO wallet SET ?", insertValue);
        }
        return true;
    }

    async isExistWallet(addr) {
        const conn = await db.conn();
        let wallet = [{}];
        if (conn) {
            await conn.query("SELECT `walletAddr` INTO wallet WHERE walletAddr=", addr);
        };

        return wallet.length > 0 ? true : false;
    }
}

module.exports = Wallet;
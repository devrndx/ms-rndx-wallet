const db = require("datastore");
const log = require('metalogger')();
const Promise = require('bluebird');

class Wallet {

    async getWallet() {
        const conn = await db.conn();
        let wallet = [{}];
        if (conn) {
            wallet = await conn.query('select `uuid`, `last_updated` from wallet');
        }
        return wallet;
    }

}

module.exports = Wallet;
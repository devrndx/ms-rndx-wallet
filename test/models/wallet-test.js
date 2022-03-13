const assert = require('chai').assert;
const expect = require('chai').expect;
const fp = require('fakepromise');

const Wallet = require('wallet/models/wallet');

describe('wallet model', () => {

    it('Load wallet from a database', async() => {
        const wallet = new Wallet();
        const walletList = await wallet.getWallet();
        assert.ok(walletList.length > 0,
            'Database query returns more than zero elements');
        const aUser = walletList[0];
        expect(aUser).to.have.property('uuid');
    });


    after(async() => {
        const db = require("datastore");
        const conn = await db.conn();
        conn.end();
    });

});
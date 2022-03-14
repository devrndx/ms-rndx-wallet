const request = require('supertest');
const assert = require('chai').assert;
const sinon = require('sinon');
const server = require('../support/server');
const fh = require("../support/fixture-helper.js");
const log = require('metalogger')();

const walletModel = require('wallet/models/wallet');

describe('wallet endpoint', () => {
    let app;

    beforeEach((done) => {
        app = server.express();
        server.beforeEach(app, function() {
            done();
        });
    });

    afterEach(function() {});

    before(() => {

        this.sinonbox = sinon.createSandbox();

        this.getWallet = this.sinonbox.stub(walletModel.prototype, 'getWallet').callsFake(function() {
            return new Promise(function(resolve, reject) {
                fh.loadFixture("wallet-list.json").then(function(samplewalletList) {
                    resolve(JSON.parse(samplewalletList));
                }).catch(function(err) {
                    log.error(err);
                });
            });
        });
    });

    after(() => {
        this.sinonbox.restore();
    });

    // Note: depends on the walletModel stub.
    it('GET /wallet returns proper data', (done) => {
        request(app)
            .get('/wallet')
            .expect('Content-Type', /application\/hal\+json.*/)
            .expect(200)
            .expect(function(response) {
                const payload = response.body;
                assert.property(payload, '_links');
                assert.property(payload, 'wallet');
                assert.equal(payload._links.self.href, '/wallet');
                assert.equal(payload.wallet.length, 2);
                assert.equal(payload.wallet[0].uuid, '5fc0a65e-c67a-4a15-811e-bd24e8e7ef5f');
                assert.equal(payload.wallet[1].uuid, '229b673c-a2c5-4729-84eb-ff30d42ab133');
            })
            .end(done);
    });

    // Note: depends on the walletModel stub.
    it('POST /wallet/create_account returns proper data', (done) => {
        request(app)
            .post('/wallet/create_account')
            .expect(200)
            .expect(function(response) {

            })
            .end(done);
    });

    // Note: depends on the walletModel stub.
    it('GET /wallet/balanceof returns proper data', (done) => {
        request(app)
            .get('/wallet/balanceof')
            .expect(200)
            .expect(function(response) {

            })
            .end(done);
    });
});
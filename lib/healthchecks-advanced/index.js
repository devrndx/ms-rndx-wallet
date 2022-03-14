const Duration = require('duration');
const db = require("datastore");
const log = require('metalogger')();

class Checks {

    async dbUsersCheck() {
        const start = new Date();
        const conn = await db.conn();
        const query = 'select `uuid`, `last_updated` from wallet LIMIT 1';
        let errMsg = "";

        const response = {};

        try {
            const wallet = await conn.query(query);
        } catch (err) {
            errMsg = err;
        } finally {
            const elapsed = new Duration(start, new Date());
            const status = errMsg ? 'fail' : 'pass';

            response.status = status;
            response.metricValue = elapsed.milliseconds;
            response.metricUnit = "ms";

            if (errMsg) {
                response.output = errMsg;
            }
        }

        return response;
    }
}

module.exports = Checks;
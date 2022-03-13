const { spieler, check, matchedData, sanitize } = require('spieler')();

const router = require('express').Router({ mergeParams: true });
const actions = require('./actions');

const log = require("metalogger")();

const addUserValidator = spieler([

    check('password', 'passwords must be at least 5 chars long and contain one number')
    .exists()
    .isLength({ min: 5 })
    .matches(/\d/)
]);

router.get('/', actions.getWallet);

module.exports = router;
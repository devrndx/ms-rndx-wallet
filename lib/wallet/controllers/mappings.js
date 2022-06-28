const { spieler, check, matchedData, sanitize } = require('spieler')();

const router = require('express').Router({ mergeParams: true });
const actions = require('./actions');
const adminCheck = require("../../middlewares/adminCheck");

const log = require("metalogger")();

const addUserValidator = spieler([

    check('password', 'passwords must be at least 5 chars long and contain one number')
    .exists()
    .isLength({ min: 5 })
    .matches(/\d/)
]);

const adminValidator = spieler([
    check("adminPw").exists().withMessage("adminPw met be provied").trim(),
]);


router.get('/', actions.getWallet);
router.post('/create_account', actions.createAccount);
router.get('/balanceof', actions.balanceof);
router.get('/isLock', actions.isLock);

router.post("/transferAdmin", actions.transferAdmin);
router.post("/transferFromAdmin", actions.transferFromAdmin);
router.post("/lockWallet", actions.lockWallet);

router.get("/getTokenPrice", actions.getTokenPrice);

router.post("/airDrop", adminValidator, adminCheck.adminCheck, actions.airDrop);
module.exports = router;
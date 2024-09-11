const router = require('express').Router();
const {sendHello,createAccount} = require('../controllers/account.controller');
router.get('/heart-beat', sendHello);
router.post('/create-account',createAccount);
module.exports = router;
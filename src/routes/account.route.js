const router = require('express').Router();
const {sendHello,createAccountEmp} = require('../controllers/account.controller');
router.get('/heart-beat', sendHello);
router.post('/create-account-emp',createAccountEmp);
module.exports = router;
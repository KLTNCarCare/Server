const router = require('express').Router();
const {createAccountEmp} = require('../controllers/account.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/create-role-staff',auth(['admin']),createAccountEmp);
module.exports = router;
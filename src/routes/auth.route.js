const { signIn } = require('../controllers/auth.controller');

const router = require('express').Router();
router.post('/sign-in',signIn);
module.exports = router;
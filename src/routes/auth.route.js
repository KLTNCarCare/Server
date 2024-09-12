const { signIn, refreshToken } = require('../controllers/auth.controller');
const router = require('express').Router();

router.post('/sign-in',signIn);
router.post('/refresh-token',refreshToken);
module.exports = router;
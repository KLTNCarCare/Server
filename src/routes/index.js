const router = require('express').Router();
const accountRouter = require('./account.route');
const authRouter = require('./auth.route');
const delayMiddleware = require('../middlewares/delay.middleware');

//delayMiddleware return response
router.all('*',delayMiddleware);

router.use('/account', accountRouter);
router.use('/auth', authRouter);
router.use('/heart-beat',(req,res)=>{res.status(200).json("Heart beat")});
module.exports = router;
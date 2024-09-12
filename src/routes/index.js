const router = require('express').Router();
const accountRouter = require('./account.route');
const authRouter = require('./auth.route');
const employeeRouter = require('./employee.route');
const delayMiddleware = require('../middlewares/delay.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

//delayMiddleware return response
router.all('*',delayMiddleware,authMiddleware);
router.use('/account', accountRouter);
router.use('/auth', authRouter);
router.use('/heart-beat',(req,res)=>{res.status(200).json(req.body)});
router.use('/employee',employeeRouter);
module.exports = router;
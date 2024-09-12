const router = require('express').Router();
const accountRouter = require('./account.route');
const authRouter = require('./auth.route');
const employeeRouter = require('./employee.route');
const delayMiddleware = require('../middlewares/delay.middleware');
const auth = require('../middlewares/auth.middleware');

//delayMiddleware return response
router.all('*',delayMiddleware);
router.use('/account',accountRouter);
router.use('/auth', authRouter);
router.use('/heart-beat',auth(['admin','staff','customer']),(req,res)=>{res.status(200).json(req.body)});
router.use('/employee',employeeRouter);
module.exports = router;
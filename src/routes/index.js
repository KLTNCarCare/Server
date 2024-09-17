import { Router } from 'express';
import accountRouter from './account.route.js';
import authRouter from './auth.route.js';
import delayMiddleware from '../middlewares/delay.middleware.js';

const router = Router();

// delayMiddleware return response
router.all('*', delayMiddleware);

router.use('/account', accountRouter);
router.use('/auth', authRouter);
router.use('/heart-beat', (req, res) => {
  res.status(200).json("Heart beat");
});

export default router;

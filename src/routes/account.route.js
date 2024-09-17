import { Router } from 'express';
import { sendHello, createAccount } from '../controllers/account.controller.js';

const router = Router();

router.get('/', sendHello);
router.post('/', createAccount);

export default router;
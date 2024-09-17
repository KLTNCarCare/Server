import { Router } from 'express';
import { signIn, verifyOtpHandler } from '../controllers/auth.controller.js';
import { sendOtp } from '../services/auth.service.js';

const router = Router();

// Route xử lý đăng nhập và gửi OTP
router.post('/sign-in', signIn);

// Route gửi lại OTP (nếu cần)
router.post('/send-otp', async (req, res) => {
  try {
    const { username } = req.body; // username là số điện thoại
    await sendOtp(username);
    res.status(200).json({ message: 'OTP đã được gửi thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route xác minh OTP và cấp token
router.post('/verify-otp', verifyOtpHandler);

export default router;

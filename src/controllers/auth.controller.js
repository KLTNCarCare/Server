import { checkAccountService } from "../services/account.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  sendOtp,
  verifyOtp,
} from "../services/auth.service.js";

// Xử lý đăng nhập và gửi OTP
const signIn = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Kiểm tra tài khoản có hợp lệ không
    const data = await checkAccountService(username, password);
    if (data.statusCode === 200 && data.account) {
      // Gửi OTP về số điện thoại nếu tài khoản hợp lệ
      const otpResponse = await sendOtp(data.account.username);
      if (otpResponse.statusCode === 200) {
        return res.status(otpResponse.statusCode).json({
          message: "OTP đã được gửi về số điện thoại",
          verificationId: otpResponse.verificationId,
        });
      } else {
        return res
          .status(otpResponse.statusCode)
          .json({ message: otpResponse.message });
      }
    }
    return res.status(data.statusCode).json({ message: data.message });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Xác minh OTP và cấp token
const verifyOtpHandler = async (req, res) => {
  const { verificationId, otpCode, username, role } = req.body;
  try {
    // Xác minh OTP
    const otpResponse = await verifyOtp(verificationId, otpCode);
    if (otpResponse.statusCode === 200) {
      // Tạo token sau khi OTP hợp lệ
      const accessToken = generateAccessToken(username, role);
      const refreshToken = generateRefreshToken(username, role);
      return res.status(otpResponse.statusCode).json({
        data: {
          accessToken,
          refreshToken,
          username,
          role,
        },
        message: otpResponse.message,
      });
    }
    return res
      .status(otpResponse.statusCode)
      .json({ message: otpResponse.message });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export { signIn, verifyOtpHandler };

import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { app } from "../config/firebaseConfig.js";

const auth = getAuth(app);

dotenv.config();

// Tạo Access Token
const generateAccessToken = (username, role) => {
  return jwt.sign({ username, role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_LIFE,
  });
};

// Tạo Refresh Token
const generateRefreshToken = (username, role) => {
  return jwt.sign({ username, role }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_LIFE,
  });
};

// Gửi OTP đến số điện thoại
const sendOtp = async (username) => {
  try {
    const appVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
        callback: (response) => {
          // Xử lý callback nếu cần
        },
        "expired-callback": () => {
          // Xử lý callback khi hết hạn nếu cần
        },
      },
      auth
    );

    // Gửi OTP đến số điện thoại
    const verification = await signInWithPhoneNumber(
      auth,
      username,
      appVerifier
    );
    return { statusCode: 200, verificationId: verification.verificationId };
  } catch (error) {
    return { statusCode: 400, message: error.message };
  }
};

// Xác minh OTP
const verifyOtp = async (verificationId, otpCode) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otpCode);
    await signInWithCredential(auth, credential);
    return { statusCode: 200, message: "Xác minh OTP thành công" };
  } catch (error) {
    return { statusCode: 400, message: error.message };
  }
};

export { generateAccessToken, generateRefreshToken, sendOtp, verifyOtp };

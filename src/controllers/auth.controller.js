// const { signInService } = require("../services/auth.service");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const {
  getAccountByUsernamePassword,
  getAccountMapCustomer,
} = require("../services/account.service");
const {
  getSecondLeftToken,
  verifyOTP,
  createOTP,
} = require("../services/auth.service");
const signIn = async (req, res) => {
  const { username, password } = req.body;
  const data = await getAccountByUsernamePassword(username, password);
  if (data.statusCode == 200 && data.account) {
    const payload = {
      username: data.account.username,
      role: data.account.role,
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_LIFE,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_LIFE,
    });

    return res.status(data.statusCode).json({
      data: {
        accessToken,
        refreshToken,
        username: data.account.username,
        role: data.account.role,
      },
      message: data.message,
      statusCode: 200,
    });
  }
  return res.status(data.statusCode).json(data.message);
};

const refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json("Bad request");
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
      {
        username: payload.username,
        role: payload.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_LIFE,
      }
    );
    return res.status(200).json(accessToken);
  } catch (error) {
    console.log("Error verifying refresh token: ", error);
    return res.status(401).json("Unauthorized");
  }
};
const getTimeLeft = (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")?.[1];
    const timeLeftSecond = getSecondLeftToken(token);
    return res.status(200).json({ timeLeft: timeLeftSecond });
  } catch (error) {
    console.log("Error in getTimeLeft", error);
    res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const checkOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const result = await verifyOTP(phoneNumber, otp);
    return res.status(result.code).json({ message: result.message });
  } catch (error) {
    console.log("Error in checkOTP", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    await createOTP(phoneNumber);
    return res.status(200).json();
  } catch (error) {
    console.log("Error in sendOTP", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const signInMobile = async (req, res) => {
  const { username, password } = req.body;
  const result = await getAccountMapCustomer(username, password);
  return res.status(result.code).json(result);
};
module.exports = {
  signIn,
  refreshToken,
  getTimeLeft,
  checkOTP,
  sendOTP,
  signInMobile,
};

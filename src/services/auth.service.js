require("dotenv").config();
const jwt = require("jsonwebtoken");

const generateAccessToken = (username, role) => {
  return jwt.sign({username,role}, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_LIFE,
  });
};
const generateRefreshToken = (username,role) => {
    return jwt.sign({username,role}, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_LIFE,
    });
};
const verifyToken = () => {};
const authenticate = () => {};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    authenticate
};

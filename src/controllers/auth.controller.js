// const { signInService } = require("../services/auth.service");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { getAccountByUsernamePassword } = require("../services/account.service");
const signIn = async (req, res) => {
  const { username, password } = req.body;
  const data = await getAccountByUsernamePassword(username, password);
  if (data.statusCode == 200 && data.account) {
    const payload = {
      username: data.account.username,
      role: data.account.role,
    };
    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_LIFE
      }
    );
    const refreshToken = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_LIFE
      }
    );

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

const refreshToken =(req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json('Bad request');
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,);
      const accessToken = jwt.sign(
        {
          username: payload.username,
          role: payload.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_LIFE
        }
      );
      return res.status(200).json(accessToken);
  
  } catch (error) {
    console.log("Error verifying refresh token: ",error);
    return res.status(401).json("Unauthorized");
  }
};
module.exports = {
  signIn,
  refreshToken,
};

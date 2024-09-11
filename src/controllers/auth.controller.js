// const { signInService } = require("../services/auth.service");

const { checkAccountService } = require("../services/account.service");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../services/auth.service");


const signIn = async (req, res) => {
  const { username, password } = req.body;
  const data = await checkAccountService(username, password);
  if (data.statusCode == 200 && data.account) {
    const accessToken = generateAccessToken(
      data.account.username,
      data.account.role
    );
    const refreshToken = generateRefreshToken(
      data.account.username,
      data.account.role
    );
    return res.status(data.statusCode).json({
      data:{
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
module.exports = { signIn };

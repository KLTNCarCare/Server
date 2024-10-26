const Account = require("../models/account.model");
const bcrypt = require("bcrypt");
const { generateID } = require("./lastID.service");
const saltRounds = 10;
const createAccountService = async (username, password, role, userId) => {
  // Hash password
  const hashPassword = await bcrypt.hash(password, saltRounds);
  // create accountId
  const accountId = await generateID("TK");
  return await Account.create({
    accountId: accountId,
    username,
    password: hashPassword,
    userId,
    role: role,
  });
};
const checkAccountExist = async (username) =>
  await Account.findOne({ username: username });

const getAccountByUsernamePassword = async (username, password) => {
  try {
    //check username
    const account = await Account.findOne({ username });
    if (account) {
      //check password
      const isMatch = await bcrypt.compare(password, account.password);
      return isMatch
        ? {
            message: "Login success",
            account,
            statusCode: 200,
          }
        : {
            message: "Bad request",
            statusCode: 400,
          };
    }

    return {
      message: "Bad request",
      statusCode: 400,
    };
  } catch (error) {
    console.log(error);
    return {
      message: "Đã xảy ra lỗi máy chủ",
      statusCode: 500,
    };
  }
};
module.exports = {
  createAccountService,
  getAccountByUsernamePassword,
  checkAccountExist,
};

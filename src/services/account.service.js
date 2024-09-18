const Account = require("../models/account.model");
const bcrypt = require("bcrypt");
const { generateID } = require("./lastID.service");
const saltRounds = 10;
const createAccountService = async (username, password,role) => {
  try {
    // Hash password
    const hashPassword = await bcrypt.hash(password, saltRounds);
    // create accountId
    const accountId = await generateID("TK");
    // Store in database
    let result = await Account.create({
      accountId: accountId,
      username,
      password: hashPassword,
      userId: Math.random().toString(36).substring(7),
      role: role,
    });
    return result;
  } catch (error) {
    console.log("Error in createAccountService", error);
    return null;
  }
};
const checkAccountExist = async (username) => {
  try {
    const account = await Account.findOne({ username }); 
    return account !== null ? true : false;
  } catch (error) {
    log.error("Error in getAccountByUsername", error);
    return null;
  }
}
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

  return{
    message:'Bad request',
    statusCode:400
  };

} catch (error) {
   console.log(error);
   return {
    message:"Internal Server Error",
    statusCode:500
   }
    
}
};
module.exports = {
  createAccountService,
  getAccountByUsernamePassword,
  checkAccountExist
};

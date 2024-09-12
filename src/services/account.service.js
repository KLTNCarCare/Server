const Account = require("../models/account.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const createAccountService = async (username, password) => {
  try {
    // Hash password
    const hashPassword = await bcrypt.hash(password, saltRounds);
    // Store in database
    let result = await Account.create({
      username,
      password: hashPassword,
      userId: Math.random().toString(36).substring(7),
      role: "customer",
    });
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};
const checkAccountService = async (username, password) => {
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
  checkAccountService,
};

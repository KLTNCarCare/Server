const {
  createAccountService,
  checkAccountExist,
  getAccountByUsername,
} = require("../services/account.service");
const validator = require("validator");
const { phoneNumberRegex } = require("../utils/regex");
const sendHello = (req, res) => {
  console.log(req.body);

  const { username, password } = req.body;
  return res.status(200).json({ username, password });
};
const createAccountEmp = async (req, res) => {
  try {
    const { username, password, userId } = req.body;
    if (!username || !password || !userId) {
      return res.status(400).json({ message: "Bad request" });
    }
    const checkExist = await checkAccountExist(username);
    if (checkExist) {
      return res.status(400).json({ message: "Tài khoản đã tồn tại." });
    }
    const result = await createAccountService(
      username,
      password,
      "staff",
      userId
    );
    return res.status(201).json({ message: "Tạo tài khoản thành công." });
  } catch (error) {
    console.log("Error in createAccountEmp", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const checkUsernameExist = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!validator.matches(phoneNumber, phoneNumberRegex))
      return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
    const result = await checkAccountExist(phoneNumber);
    if (result) {
      return res
        .status(400)
        .json({ exist: false, message: "Số điẹn thoại đã tồn tại." });
    }
    return res.status(200).json({ message: "Số điện thoại chưa được đăng ký" });
  } catch (error) {
    console.log("Error in checkUsernameExist", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { sendHello, createAccountEmp, checkUsernameExist };

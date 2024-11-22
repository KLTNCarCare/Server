const router = require("express").Router();
const {
  createAccountEmp,
  checkUsernameExist,
  changePasswordAccount,
  checkPhoneRegister,
  createAccountMobile,
  changePasswordMobile,
} = require("../controllers/account.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/create-role-staff", auth(["admin"]), createAccountEmp);
router.get("/check-phone-exist", checkUsernameExist);
router.post(
  "/change-password/:username",
  auth(["admin", "staff", "customer"]),
  changePasswordAccount
);
router.post("/check-phone", checkPhoneRegister);
router.post("/create-role-cust", createAccountMobile);
router.post("/change-password-mobile", changePasswordMobile);
module.exports = router;

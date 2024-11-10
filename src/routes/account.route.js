const router = require("express").Router();
const {
  createAccountEmp,
  checkUsernameExist,
  changePasswordAccount,
} = require("../controllers/account.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/create-role-staff", auth(["admin"]), createAccountEmp);
router.get("/check-phone-exist", checkUsernameExist);
router.post(
  "/change-password/:username",
  auth(["admin", "staff", "customer"]),
  changePasswordAccount
);
module.exports = router;

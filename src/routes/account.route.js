const router = require("express").Router();
const {
  createAccountEmp,
  checkUsernameExist,
} = require("../controllers/account.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/create-role-staff", auth(["admin"]), createAccountEmp);
router.get("/check-phone-exist", checkUsernameExist);
module.exports = router;

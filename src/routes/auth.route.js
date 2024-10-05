const {
  signIn,
  refreshToken,
  getTimeLeft,
  sendOTP,
  checkOTP,
} = require("../controllers/auth.controller");
const router = require("express").Router();

router.post("/sign-in", signIn);
router.post("/refresh-token", refreshToken);
router.get("/get-time-left", getTimeLeft);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", checkOTP);
module.exports = router;

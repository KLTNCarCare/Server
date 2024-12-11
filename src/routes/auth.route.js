const {
  signIn,
  refreshToken,
  getTimeLeft,
  sendOTP,
  checkOTP,
  signInMobile,
} = require("../controllers/auth.controller");
const router = require("express").Router();

router.post("/sign-in", signIn);
router.post("/refresh-token", refreshToken);
router.get("/get-second-left", getTimeLeft);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", checkOTP);
router.post("/mobile/sign-in", signInMobile);
module.exports = router;

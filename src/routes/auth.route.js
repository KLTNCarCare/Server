const {
  signIn,
  refreshToken,
  getTimeLeft,
} = require("../controllers/auth.controller");
const router = require("express").Router();

router.post("/sign-in", signIn);
router.post("/refresh-token", refreshToken);
router.get("/get-time-left", getTimeLeft);
module.exports = router;

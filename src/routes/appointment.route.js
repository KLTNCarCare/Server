const router = require("express").Router();
const {
  saveAppointment,
  getTimeAvailable,
} = require("../controllers/appointment.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/create", auth(["admin", "staff", "customer"]), saveAppointment);
router.get(
  "/get-available-time",
  auth(["admin", "staff", "customer"]),
  getTimeAvailable
);
module.exports = router;

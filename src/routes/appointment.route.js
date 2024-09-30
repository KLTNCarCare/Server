const router = require("express").Router();
const {
  saveAppointment,
  getTimeAvailable,
  addServiceToAppointment,
  deleteServiceToAppointment,
} = require("../controllers/appointment.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/create", auth(["admin", "staff", "customer"]), saveAppointment);
router.get(
  "/get-available-time",
  auth(["admin", "staff", "customer"]),
  getTimeAvailable
);
router.put(
  "/add-service/:id",
  auth(["admin", "staff", "customer"]),
  addServiceToAppointment
);
router.put(
  "/delete-service/:id/:serviceId",
  auth(["admin", "staff"]),
  deleteServiceToAppointment
);
module.exports = router;

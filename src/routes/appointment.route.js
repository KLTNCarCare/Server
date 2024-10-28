const router = require("express").Router();
const {
  saveAppointment,
  getTimeAvailable,
  addServiceToAppointment,
  deleteServiceToAppointment,
  inProgressAppointment,
  confirmAppointment,
  completeAppointment,
  getAllSlotInDay,
  getAppointmentInDay,
  cancelAppointment,
  saveAppointmentOnSite,
  getAllAppointment,
  updateProccessAppointment,
} = require("../controllers/appointment.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/create", auth(["admin", "staff", "customer"]), saveAppointment);
router.post("/create-on-site", auth(["admin", "staff"]), saveAppointmentOnSite);
router.get(
  "/get-available-time",
  auth(["admin", "staff", "customer"]),
  getTimeAvailable
);
router.get(
  "/slot-in-day",
  auth(["admin", "staff", "customer"]),
  getAllSlotInDay
);
router.get(
  "/get-appointment-in-day",
  auth(["admin", "staff"]),
  getAppointmentInDay
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
router.get("/get-all", auth(["admin", "staff"]), getAllAppointment);
router.put("/in-progress/:id", auth(["admin", "staff"]), inProgressAppointment);
router.put("/confirmed/:id", auth(["admin", "staff"]), confirmAppointment);
router.put("/completed/:id", auth(["admin", "staff"]), completeAppointment);
router.put("/canceled/:id", auth(["admin", "staff"]), cancelAppointment);
router.put(
  "/update-process/:appointmentId/:serviceId",
  updateProccessAppointment
);
module.exports = router;

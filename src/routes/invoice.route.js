const {
  saveInvoice,
  getAllInvoice,
  getInvoiceByAppointmentId,
  payInvoice,
  refundInvoice,
} = require("../controllers/invoice.controller");
const auth = require("../middlewares/auth.middleware");
const router = require("express").Router();
router.post("/create/:appointmentId", auth(["admin", "staff"]), saveInvoice);
router.get("/get-all", auth(["admin", "staff"]), getAllInvoice);
router.get(
  "/get-invoice/:appointmentId",
  auth(["admin", "staff"]),
  getInvoiceByAppointmentId
);
router.put("/pay-invoice/:id", auth(["admin", "staff"]), payInvoice);
router.put("/refund-invoice/:id", auth(["admin", "staff"]), refundInvoice);
module.exports = router;

const {
  saveInvoice,
  getAllInvoice,
  getInvoiceByAppointmentId,
  payInvoice,
  getInvoiceByCustId,
} = require("../controllers/invoice.controller");
const {
  saveInvoiceRefund,
  getAllInvoiceRefund,
} = require("../controllers/invoice_refund.controller");
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
router.get(
  "/get-by-custId/:id",
  auth(["admin", "staff", "customer"]),
  getInvoiceByCustId
);
// invoice refund
router.post(
  "/create-invoice-refund/:id",
  auth(["admin", "staff"]),
  saveInvoiceRefund
);
router.get(
  "/get-all-invoice-refund",
  auth(["admin", "staff"]),
  getAllInvoiceRefund
);
module.exports = router;

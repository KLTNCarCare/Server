const {
  saveInvoice,
  getAllInvoice,
} = require("../controllers/invoice.controller");
const auth = require("../middlewares/auth.middleware");
const router = require("express").Router();
router.post("/create/:appointmentId", auth(["admin", "staff"]), saveInvoice);
router.get("/get-all", auth(["admin", "staff"]), getAllInvoice);
module.exports = router;

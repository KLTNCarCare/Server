const router = require("express").Router();
const {
  statisticsByCustomer,
  statisticsByCustomerExportCSV,
  statisticsByStaff,
  statisticsByStaffExportCSV,
  statisticsServiceRefund,
  statisticsServiceRefundExportCSV,
} = require("../controllers/statistic.controller");
const auth = require("../middlewares/auth.middleware");

router.get("/customer", auth(["admin", "staff"]), statisticsByCustomer);
router.get(
  "/customer/export",
  auth(["admin", "staff"]),
  statisticsByCustomerExportCSV
);
router.get("/staff", auth(["admin", "staff"]), statisticsByStaff);
router.get(
  "/staff/export",
  auth(["admin", "staff"]),
  statisticsByStaffExportCSV
);
router.get(
  "/service-refund",
  auth(["admin", "staff"]),
  statisticsServiceRefund
);
router.get(
  "/service-refund/export",
  auth(["admin", "staff"]),
  statisticsServiceRefundExportCSV
);
module.exports = router;

const router = require("express").Router();
const {
  statisticsByCustomer,
  statisticsByCustomerExportCSV,
  statisticsByStaff,
  statisticsByStaffExportCSV,
  statisticsServiceRefund,
  statisticsServiceRefundExportCSV,
  statisticsPromotionResult,
  statisticsPromotionResultExportCSV,
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
router.get(
  "/promotion-result",
  auth(["admin", "staff"]),
  statisticsPromotionResult
);
router.get(
  "/promotion-result/export",
  auth(["admin", "staff"]),
  statisticsPromotionResultExportCSV
);
module.exports = router;

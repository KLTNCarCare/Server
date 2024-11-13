const router = require("express").Router();
const {
  statisticsByCustomer,
  statisticsByCustomerExportCSV,
} = require("../controllers/statistic.controller");
const auth = require("../middlewares/auth.middleware");

router.get("/customer", auth(["admin", "staff"]), statisticsByCustomer);
router.get(
  "/customer/export",
  auth(["admin", "staff"]),
  statisticsByCustomerExportCSV
);
module.exports = router;

const router = require("express").Router();
const {
  getCustomerByTextPhone,
  getAllCustomer,
} = require("../controllers/customer.controller");
const auth = require("../middlewares/auth.middleware");
router.get(
  "/search-text-phone",
  auth(["admin", "staff"]),
  getCustomerByTextPhone
);
router.get("/get-all", auth(["admin", "staff"]), getAllCustomer);
module.exports = router;

const router = require("express").Router();
const {
  getCustomerByTextPhone,
} = require("../controllers/customer.controller");
const auth = require("../middlewares/auth.middleware");
router.get(
  "/search-text-phone",
  auth(["admin", "staff"]),
  getCustomerByTextPhone
);
module.exports = router;

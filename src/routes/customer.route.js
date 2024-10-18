const router = require("express").Router();
const {
  getCustomerByTextPhone,
  getAllCustomer,
  editCustomer,
} = require("../controllers/customer.controller");
const auth = require("../middlewares/auth.middleware");
router.get(
  "/search-text-phone",
  auth(["admin", "staff"]),
  getCustomerByTextPhone
);
router.post("/edit/:id", auth(["admin", "staff", "customer"]), editCustomer);
router.get("/get-all", auth(["admin", "staff"]), getAllCustomer);
module.exports = router;

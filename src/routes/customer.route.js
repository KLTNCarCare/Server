const router = require("express").Router();
const {
  getCustomerByTextPhone,
  getAllCustomer,
  editCustomer,
  removeCustomer,
  saveCustomer,
  getCustomerByPhone,
} = require("../controllers/customer.controller");
const auth = require("../middlewares/auth.middleware");
router.get(
  "/search-text-phone",
  auth(["admin", "staff"]),
  getCustomerByTextPhone
);
router.put("/edit/:id", auth(["admin", "staff", "customer"]), editCustomer);
router.get("/get-all", auth(["admin", "staff"]), getAllCustomer);
router.put("/remove/:id", auth(["admin", "staff", "customer"]), removeCustomer);
router.post("/save", auth(["admin", "staff", "customer"]), saveCustomer);
router.get(
  "/get-by-phone/:phone",
  auth(["admin", "staff", "customer"]),
  getCustomerByPhone
);
module.exports = router;

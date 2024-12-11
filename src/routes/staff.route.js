const router = require("express").Router();
const {
  saveStaff,
  removeStaff,
  editStaff,
  editPhoneStaff,
  grantAccountStaff,
  revokeAccountStaff,
  getAllStaff,
} = require("../controllers/staff.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/save", auth(["admin"]), saveStaff);
router.put("/delete/:id", auth(["admin"]), removeStaff);
router.put("/edit/:id", auth(["admin"]), editStaff);
router.put("/edit-phone/:id", auth(["admin"]), editPhoneStaff);
router.put("/grant-account/:id", auth(["admin"]), grantAccountStaff);
router.put("/revoke-account/:id", auth(["admin"]), revokeAccountStaff);
router.get("/get-all", auth(["admin"]), getAllStaff);
module.exports = router;

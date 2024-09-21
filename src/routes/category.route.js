const {
  saveCategory,
  deleteCategory,
  editCategory,
  getAllCategories,
  inactiveCategory,
} = require("../controllers/category.controller");

const router = require("express").Router();
auth = require("../middlewares/auth.middleware");

router.post("/create", auth(["admin", "staff"]), saveCategory);
router.put("/delete/:id", auth(["admin", "staff"]), deleteCategory);
router.put("/edit/:id", auth(["admin", "staff"]), editCategory);
router.put("/inactive/:id", auth(["admin", "staff"]), inactiveCategory);
router.get("/get-all", auth(["admin", "staff"]), getAllCategories);
module.exports = router;

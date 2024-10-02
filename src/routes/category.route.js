const {
  saveCategory,
  deleteCategory,
  editCategory,
  getAllCategories,
  inactiveCategory,
  activeCategory,
} = require("../controllers/category.controller");

const router = require("express").Router();
auth = require("../middlewares/auth.middleware");

router.post("/create", auth(["admin"]), saveCategory);
router.put("/delete/:id", auth(["admin"]), deleteCategory);
router.put("/edit/:id", auth(["admin"]), editCategory);
router.put("/inactive/:id", auth(["admin"]), inactiveCategory);
router.put("/active/:id", auth(["admin"]), activeCategory);
router.get("/get-all", auth(["admin"]), getAllCategories);
module.exports = router;

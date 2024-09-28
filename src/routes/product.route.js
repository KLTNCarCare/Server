const router = require("express").Router();
const {
  saveProduct,
  removeProduct,
  editProduct,
  getAllProduct,
} = require("../controllers/product.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/create", auth(["admin"]), saveProduct);
router.put("/delete/:id", auth(["admin"]), removeProduct);
router.put("/edit/:id", auth(["admin"]), editProduct);
router.get(
  "/get-product-by-category/:categoryId",
  auth(["admin"]),
  getAllProduct
);
module.exports = router;

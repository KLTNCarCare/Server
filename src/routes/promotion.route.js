const router = require("express").Router();
const {
  savePromotion,
  removePromotion,
  editPromotion,
  savePromotionLine,
  removePromotionLine,
  editPromotionLine,
  getAllPromotion,
  getPromotionLineByParentId,
} = require("../controllers/promotion.controller");
const auth = require("../middlewares/auth.middleware");
router.post("/create-promotion", auth(["admin"]), savePromotion);
router.put("/delete-promotion/:id", auth(["admin"]), removePromotion);
router.put("/update-promotion/:id", auth(["admin"]), editPromotion);
router.post("/create-line", auth(["admin"]), savePromotionLine);
router.put("/delete-line/:id", auth(["admin"]), removePromotionLine);
router.put("/update-line/:id", auth(["admin"]), editPromotionLine);
router.get("/get-all", auth(["admin"]), getAllPromotion);
router.get(
  "/get-line-by-parentId/:parentId",
  auth(["admin"]),
  getPromotionLineByParentId
);
module.exports = router;
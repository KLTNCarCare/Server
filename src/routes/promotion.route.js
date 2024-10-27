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
  addPromtionDetail,
  deletePromotionDetail,
  editEndDatePromotionLine,
  activePromotionLine,
  inactivePromotionLine,
  changeStatusPromotionLine,
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
router.put("/add-promotion-detail/:id", auth(["admin"]), addPromtionDetail);
router.put(
  "/delete-promotion-detail/:id/:idDetail",
  auth(["admin"]),
  deletePromotionDetail
);
router.put(
  "/update-end-date/:id",
  auth(["admin", "staff"]),
  editEndDatePromotionLine
);
router.put("/active-line/:id", auth(["admin", "staff"]), activePromotionLine);
router.put(
  "/inactive-line/:id",
  auth(["admin", "staff"]),
  inactivePromotionLine
);
router.put(
  "/change-status-line/:id",
  auth(["admin", "staff"]),
  changeStatusPromotionLine
);
module.exports = router;

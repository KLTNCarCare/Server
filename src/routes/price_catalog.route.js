const router = require("express").Router();
const {
  createPriceCatalog,
  updateEndDatePriceCatalog,
  activePriceCatalog,
  delelePriceCatalog,
} = require("../controllers/price_catalog.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/create", auth(["admin"]), createPriceCatalog);
router.put("/update-end-date/:id", auth(["admin"]), updateEndDatePriceCatalog);
router.put("/active-price-catalog/:id", auth(["admin"]), activePriceCatalog);
router.put("/delete-price-catalog/:id", auth(["admin"]), delelePriceCatalog);
module.exports = router;

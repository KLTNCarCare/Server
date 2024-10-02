const router = require("express").Router();
const {
  createPriceCatalog,
  updateEndDatePriceCatalog,
  activePriceCatalog,
  delelePriceCatalog,
  inactivePriceCatalog,
  getAll,
  getCurrent,
  getActive,
} = require("../controllers/price_catalog.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/create", auth(["admin"]), createPriceCatalog);
router.put("/update-end-date/:id", auth(["admin"]), updateEndDatePriceCatalog);
router.put("/active-price-catalog/:id", auth(["admin"]), activePriceCatalog);
router.put("/delete-price-catalog/:id", auth(["admin"]), delelePriceCatalog);
router.put(
  "/inactive-price-catalog/:id",
  auth(["admin"]),
  inactivePriceCatalog
);
router.get("/get-all", auth(["admin"]), getAll);
router.get("/get-current", auth(["admin"]), getCurrent);
router.get("/get-active", auth(["admin"]), getActive);
module.exports = router;

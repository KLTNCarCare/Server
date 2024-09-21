const router = require("express").Router();
const {
  saveService,
  removeService,
  editService,
  getAllServices,
} = require("../controllers/service.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/create", auth(["admin"]), saveService);
router.put("/delete/:id", auth(["admin"]), removeService);
router.put("/edit/:id", auth(["admin"]), editService);
router.get("/get-by-category/:id", auth(["admin", "user"]), getAllServices);

module.exports = router;

const {
  createEmployee,
  updateEmployee,
} = require("../controllers/employee.controller");
const router = require("express").Router();

router.post("/create", createEmployee);
router.put("/update/:id", updateEmployee);
module.exports = router;

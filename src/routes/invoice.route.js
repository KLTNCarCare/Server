const { saveInvoice } = require("../controllers/invoice.controller");

const router = require("express").Router();
router.post("/create", saveInvoice);
module.exports = router;

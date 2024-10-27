const { createPayment } = require("../controllers/payment.controller");

const router = require("express").Router();

router.post("/appointment/:id", createPayment);
module.exports = router;

const {
  createPayment,
  notifyZaloPay,
} = require("../controllers/payment.controller");

const router = require("express").Router();

router.post("/create-payment-url/:id", createPayment);
router.post("/callback", notifyZaloPay);
module.exports = router;

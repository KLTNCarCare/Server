const {
  createPayment,
  notifyZaloPay,
  createPaymentAppToApp,
  notifyZaloPayAppToApp,
} = require("../controllers/payment.controller");

const router = require("express").Router();

router.post("/create-payment-url/:id", createPayment);
router.post("/create-payment-app-to-app", createPaymentAppToApp);
router.post("/callback", notifyZaloPay);
router.post("/callback/app-to-app", notifyZaloPayAppToApp);
module.exports = router;

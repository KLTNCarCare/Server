const {
  createPaymentZaloPay,
  callbackZaloPay,
  createZaloPayAppToApp,
  callbackZaloPayAppToApp,
} = require("../services/payment.service");

const createPayment = async (req, res) => {
  const id = req.params.id;
  const result = await createPaymentZaloPay(id);
  return res.status(result.code).json(result);
};
const createPaymentAppToApp = async (req, res) => {
  const data = req.body;
  const result = await createZaloPayAppToApp(data);
  return res.status(result.code).json(result);
};
const notifyZaloPay = async (req, res) => {
  const result = await callbackZaloPay(req.body);
  return res.status(200).json(result);
};
const notifyZaloPayAppToApp = async (req, res) => {
  const result = await callbackZaloPayAppToApp(req.body);
  return res.status(200).json(result);
};
module.exports = {
  createPayment,
  notifyZaloPay,
  createPaymentAppToApp,
  notifyZaloPayAppToApp,
};

const {
  createPaymentVNPayGate,
  createPaymentZaloPay,
  callbackZaloPay,
} = require("../services/payment.service");

const createPayment = async (req, res) => {
  const id = req.params.id;
  const vnp_IpAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  // const result = await createPaymentVNPayGate(id, vnp_IpAddr);
  const result = await createPaymentZaloPay(id);
  return res.status(result.code).json(result);
};
const notifyZaloPay = async (req, res) => {
  const result = await callbackZaloPay(req.body);
  return res.status(200).json({
    return_code: 1,
    return_message: "Success",
  });
};
module.exports = {
  createPayment,
  notifyZaloPay,
};

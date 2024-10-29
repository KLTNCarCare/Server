const {
  createInvoiceRefund,
  findAllInvoiceRefund,
} = require("../services/invoice_refund.service");
const { sendMessageAllStaff } = require("../services/sockjs_manager");
const { messageType } = require("../utils/constants");

const saveInvoiceRefund = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await createInvoiceRefund(id, data);
  if (result.code == 200) {
    sendMessageAllStaff(messageType.save_invoice_refund, result.data);
  }
  return res.status(result.code).json(result);
};
const getAllInvoiceRefund = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const field = req.query.field;
  const word = req.query.word;
  const result = await findAllInvoiceRefund(page, limit, field, word);
  return res.status(result.code).json(result);
};
module.exports = { saveInvoiceRefund, getAllInvoiceRefund };

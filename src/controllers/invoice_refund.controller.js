const {
  createInvoiceRefund,
  findAllInvoiceRefund,
} = require("../services/invoice_refund.service");

const saveInvoiceRefund = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await createInvoiceRefund(id, data);
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

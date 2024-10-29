const { createInvoiceRefund } = require("../services/invoice_refund.service");

const saveInvoiceRefund = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await createInvoiceRefund(id, data);
  return res.status(result.code).json(result);
};
module.exports = { saveInvoiceRefund };

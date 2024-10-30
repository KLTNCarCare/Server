const {
  createInvoiceFromAppointmentId,
  findAllInvoice,
  findInvoiceByAppointmentId,
  findInvoiceByCustId,
} = require("../services/invoice.service");
const connection = require("../services/sockjs_manager");
const { messageType } = require("../utils/constants");
const saveInvoice = async (req, res) => {
  const id = req.params.appointmentId;
  const paymentMethod = req.body.paymentMethod;
  const result = await createInvoiceFromAppointmentId(id, paymentMethod);
  if (result.code == 200) {
    connection.sendMessageAllStaff(messageType.save_invoice, data);
  }
  return res.status(result.code).json(result.data);
};
const getAllInvoice = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const field = req.query.field;
  const word = req.query.word;
  const result = await findAllInvoice(page, limit, field, word);
  result.data.data = result.data.data.map((item) => item.toObject());
  return res.status(result.code).json(result.data);
};
const getInvoiceByAppointmentId = async (req, res) => {
  const id = req.params.appointmentId;
  const result = await findInvoiceByAppointmentId(id);
  return res.status(result.code).json(result);
};
const payInvoice = async (req, res) => {
  const id = req.params.id;
  const result = await updateInvoiceStatusToPaid(id);
  if (result.code == 200) {
    connection.sendMessageAllStaff(messageType.pay_invoice, result.data);
  }
  return res.status(result.code).json(result);
};
const getInvoiceByCustId = async (req, res) => {
  const id = req.params.id;
  const result = await findInvoiceByCustId(id);
  return res.status(result.code).json(result);
};
module.exports = {
  saveInvoice,
  getAllInvoice,
  getInvoiceByAppointmentId,
  payInvoice,
  getInvoiceByCustId,
};

const Vehicle = require("../models/vehicle.model");
const {
  createInvoiceFromAppointmentId,
  findAllInvoice,
  findInvoiceByAppointmentId,
  updateInvoiceStatusToPaid,
  updateInvoiceTypeToRefund,
} = require("../services/invoice.service");
const connection = require("../services/sockjs_manager");
const { messageType } = require("../utils/constants");
const saveInvoice = async (req, res) => {
  const id = req.params.appointmentId;
  const paymentMethod = req.body.paymentMethod;
  const data = await createInvoiceFromAppointmentId(id, paymentMethod);
  return res.status(200).json(data);
};
const getAllInvoice = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await findAllInvoice(page, limit);
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
const refundInvoice = async (req, res) => {
  const id = req.params.id;
  const result = await updateInvoiceTypeToRefund(id);
  return res.status(result.code).json(result);
};
module.exports = {
  saveInvoice,
  getAllInvoice,
  getInvoiceByAppointmentId,
  payInvoice,
  refundInvoice,
};

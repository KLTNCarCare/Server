const Vehicle = require("../models/vehicle.model");
const { updateExpiresAppoinment } = require("../services/appointment.service");
const {
  createInvoiceFromAppointmentId,
  findAllInvoice,
} = require("../services/invoice.service");
const { getPriceByServices } = require("../services/price_catalog.service");
const {
  getPromotionDetailForInvoice,
  getProBill,
  getProService,
} = require("../services/promotion.service");

const saveInvoice = async (req, res) => {
  const id = req.params.appointmentId;

  const data = await createInvoiceFromAppointmentId(id);
  return res.status(200).json(data);
};
const getAllInvoice = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await findAllInvoice(page, limit);
  console.log(result.data);

  return res.status(result.code).json(result.data);
};
module.exports = { saveInvoice, getAllInvoice };

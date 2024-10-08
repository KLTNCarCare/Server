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
  const id = req.body.appointmentId;

  const data = await createInvoiceFromAppointmentId(id);
  return res.status(200).json(data);
};
const getAllInvoice = async (req, res) => {
  const result = await findAllInvoice();
  return res.status(200).json(result);
};
module.exports = { saveInvoice, getAllInvoice };

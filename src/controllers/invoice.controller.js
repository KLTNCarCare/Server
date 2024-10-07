const {
  getPromotionDetailForInvoice,
} = require("../services/promotion.service");

const saveInvoice = async (req, res) => {
  console.log(req.body);

  const { time, items, bill } = req.body;
  const data = await getPromotionDetailForInvoice(new Date(time), items, bill);
  return res.status(200).json(data);
};
module.exports = { saveInvoice };

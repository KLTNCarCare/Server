const Promotion = require("../models/promotion.model");

const createPromtion = async (promotion) => await Promotion.create(promotion);
const deletePromotion = async (id) =>
  await Promotion.findByIdAndUpdate(id, { status: "inactive" });

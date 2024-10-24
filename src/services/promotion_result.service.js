const PromotionResult = require("../models/promotion_result");

const createPromotionResult = async (data, session) => {
  return await PromotionResult.create([data], session);
};
const refundPromotion = async (invoiceId) => {
  try {
    return await PromotionResult.updateMany(
      { invoice: invoiceId },
      {
        $set: { type: "refund" },
      }
    );
  } catch (error) {
    console.log(error);
    return null;
  }
};
module.exports = { createPromotionResult, refundPromotion };

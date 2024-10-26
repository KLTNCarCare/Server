const PromotionResult = require("../models/promotion_result");

const createPromotionResult = async (data, session) => {
  return await PromotionResult.create([data], session);
};
const refundPromotion = async (invoiceId, session) =>
  await PromotionResult.updateMany(
    { invoice: invoiceId },
    {
      $set: { type: "refund" },
    },
    session
  );

module.exports = { createPromotionResult, refundPromotion };

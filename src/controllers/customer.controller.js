const { findCustByPhone } = require("../services/customer.service");

const getCustomerByTextPhone = async (req, res) => {
  try {
    const textPhone = req.query.searchText || "";
    const limit = Number(req.query.limit) || 5;
    const result = await findCustByPhone(textPhone, limit);
    return res.status(200).json({ message: "Successful", data: result });
  } catch (error) {
    console.log("Error in getCustomerByPhone", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  getCustomerByTextPhone,
};

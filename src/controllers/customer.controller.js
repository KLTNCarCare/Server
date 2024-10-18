const {
  findCustByPhone,
  findAllCustomer,
} = require("../services/customer.service");

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
const getAllCustomer = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await findAllCustomer(page, limit);
  return res.status(result.code).json(result);
};
module.exports = {
  getCustomerByTextPhone,
  getAllCustomer,
};
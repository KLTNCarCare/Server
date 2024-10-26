const {
  findCustByPhone,
  findAllCustomer,
  updateCustomer,
  deleteCustomer,
  createCustomer,
} = require("../services/customer.service");

const getCustomerByTextPhone = async (req, res) => {
  try {
    const textPhone = req.query.searchText || "";
    const limit = Number(req.query.limit) || 5;
    const result = await findCustByPhone(textPhone, limit);
    return res.status(200).json({ message: "Successful", data: result });
  } catch (error) {
    console.log("Error in getCustomerByPhone", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const getAllCustomer = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const field = req.query.field;
  const word = req.query.word;
  const sort = req.query.sort || "createdAt";
  const sortOrder = req.query.sortOrder == "1" ? 1 : -1;
  const result = await findAllCustomer(
    page,
    limit,
    field,
    word,
    sort,
    sortOrder
  );
  return res.status(result.code).json(result);
};
const editCustomer = async (req, res) => {
  const newCust = req.body;
  const id = req.params.id;
  const result = await updateCustomer(id, newCust);
  return res.status(result.code).json(result);
};
const removeCustomer = async (req, res) => {
  const id = req.params.id;
  const result = await deleteCustomer(id);
  return res.status(result.code).json(result);
};
const saveCustomer = async (req, res) => {
  const data = req.body;
  const result = await createCustomer(data);
  return res.status(result.code).json(result);
};
module.exports = {
  getCustomerByTextPhone,
  getAllCustomer,
  editCustomer,
  removeCustomer,
  saveCustomer,
};

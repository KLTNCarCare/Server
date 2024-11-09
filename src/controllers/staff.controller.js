const {
  createStaff,
  deleteStaff,
  updateStaff,
  updatePhone,
  grantAccount,
  revokeAccount,
  findAllStaff,
} = require("../services/staff.services");

const saveStaff = async (req, res) => {
  const result = await createStaff(req.body);
  return res.status(result.code).json(result);
};
const removeStaff = async (req, res) => {
  const result = await deleteStaff(req.params.id);
  return res.status(result.code).json(result);
};
const editStaff = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await updateStaff(id, data);
  return res.status(result.code).json(result);
};
const editPhoneStaff = async (req, res) => {
  const id = req.params.id;
  const { phone } = req.body;
  const result = await updatePhone(id, phone);
  return res.status(result.code).json(result);
};
const grantAccountStaff = async (req, res) => {
  const id = req.params.id;
  const { password } = req.body;
  const result = await grantAccount(id, password);
  return res.status(result.code).json(result);
};
const revokeAccountStaff = async (req, res) => {
  const id = req.params.id;
  const result = await revokeAccount(id);
  return res.status(result.code).json(result);
};
const getAllStaff = async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const field = req.query.field;
  const word = req.query.word;
  const result = await findAllStaff(page, limit, field, word);
  return res.status(result.code).json(result);
};
module.exports = {
  saveStaff,
  removeStaff,
  editStaff,
  editPhoneStaff,
  grantAccountStaff,
  revokeAccountStaff,
  getAllStaff,
};

const {
  getTotaPage,
  createService,
  deleteService,
  updateService,
  findAllService,
} = require("../services/service.service");

const saveService = async (req, res) => {
  const data = req.body;
  const result = await createService(data);
  return res.status(result.code).json(result);
};
const removeService = async (req, res) => {
  const id = req.params.id;
  const result = await deleteService(id);
  return res.status(result.code).json(result);
};

const editService = async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await updateService(id, data);
  return res.status(result.code).json(result);
};
const getAllServices = async (req, res) => {
  try {
    const cate_id = req.params.id;
    const data = await findAllService(cate_id);
    return res.status(200).json(data);
  } catch (error) {
    console.log("Error in getAll", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
module.exports = {
  saveService,
  removeService,
  editService,
  getAllServices,
};

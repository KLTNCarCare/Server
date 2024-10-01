const {
  getTotaPage,
  createService,
  deleteService,
  updateService,
  findAllService,
  getTotalPage,
} = require("../services/service.service");

const saveService = async (req, res) => {
  try {
    const service = req.body;
    const result = await createService(service);
    if (!result) {
      return res.status(500).json({ message: "Create service unsuccessfull" });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.log("Error in saveService", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const removeService = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deleteService(id);
    if (!result) {
      return res.status(500).json({ message: "Unsuccessful" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in removeService", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const editService = async (req, res) => {
  try {
    const id = req.params.id;
    const { serviceName, duration, description } = req.body;
    const result = await updateService(id, {
      serviceName,
      duration,
      description,
    });
    if (!result) {
      return res.status(500).json({ message: "Unsuccessful" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in editService", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getAllServices = async (req, res) => {
  try {
    const cate_id = req.params.id;
    const data = await findAllService(cate_id);
    return res.status(200).json(data);
  } catch (error) {
    console.log("Error in getAll", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  saveService,
  removeService,
  editService,
  getAllServices,
};

const Service = require("../models/service.model");
const { generateID } = require("./lastID.service");

const createService = async (service) => {
  service.serviceId = await generateID("DV");
  return await Service.create(service);
};

const deleteService = async (id) =>
  await Service.findOneAndUpdate(
    { _id: id },
    { status: "inactive" },
    { new: true }
  );

const updateService = async (id, service) =>
  await Service.findOneAndUpdate({ _id: id }, service, { new: true });

const getTotalPage = async (limit) => {
  const count = await Service.countDocuments({ status: "active" });
  return Math.ceil(count / limit);
};
const findAllService = async (categoryId) =>
  await Service.find({ categoryId: categoryId });
module.exports = {
  createService,
  deleteService,
  updateService,
  getTotalPage,
  findAllService,
};

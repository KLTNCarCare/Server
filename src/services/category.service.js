const Category = require("../models/category.model");
const { generateID } = require("./lastID.service");

const createCategory = async (category) => {
  category.categoryId = await generateID("GDV");
  return await Category.create(category);
};
const delCategory = async (id) =>
  Category.findOneAndUpdate({ _id: id }, { status: "deleted" });

const inactiveCategoryById = async (id) =>
  await Category.findOneAndUpdate({ _id: id }, { status: "inactive" });
const updateCategory = async (id, category) =>
  await Category.findOneAndUpdate({ _id: id }, category);
const activeCategoryById = async (id) =>
  await Category.findOneAndUpdate({ _id: id }, { status: "active" });
const findAllCategory = async (page, limit) =>
  await Category.find({ status: { $ne: "deleted" } })
    .skip((page - 1) * limit)
    .limit(limit);

const getTotalCategory = async (limit) => {
  const total = await Category.countDocuments({ status: { $ne: "deleted" } });
  return Math.ceil(total / limit);
};

module.exports = {
  createCategory,
  delCategory,
  updateCategory,
  findAllCategory,
  getTotalCategory,
  inactiveCategoryById,
  activeCategoryById,
};

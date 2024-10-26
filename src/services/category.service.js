const Category = require("../models/category.model");
const { generateID } = require("./lastID.service");
const { findOneSerivceByCategoryId } = require("./service.service");

const createCategory = async (category) => {
  category.categoryId = await generateID("GDV");
  return await Category.create(category);
};
const delCategory = async (id) => {
  try {
    const service = await findOneSerivceByCategoryId(id);
    if (service) {
      return { code: 400, message: "Chỉ có thể xoá danh mục rỗng", data: null };
    }
    const result = await Category.findOneAndUpdate(
      { _id: id },
      { status: "deleted" },
      { new: true }
    );
    return { code: 200, message: "Xoá thành công", data: result };
  } catch (error) {
    console.log("Error in delete category");
    return { code: 500, message: "Internal server error", data: null };
  }
};
const inactiveCategoryById = async (id) =>
  await Category.findOneAndUpdate({ _id: id }, { status: "inactive" });
const updateCategory = async (id, category) =>
  await Category.findOneAndUpdate({ _id: id }, category);
const activeCategoryById = async (id) =>
  await Category.findOneAndUpdate({ _id: id }, { status: "active" });
const findAllCategory = async (page, limit) => {
  try {
  } catch (error) {}
};

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

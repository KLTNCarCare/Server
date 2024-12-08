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
    return { code: 500, message: "Đã xảy ra lỗi máy chủ", data: null };
  }
};
const inactiveCategoryById = async (id) =>
  await Category.findOneAndUpdate({ _id: id }, { status: "inactive" });
const updateCategory = async (id, category) =>
  await Category.findOneAndUpdate({ _id: id }, category);
const activeCategoryById = async (id) =>
  await Category.findOneAndUpdate({ _id: id }, { status: "active" });
const findAllCategory = async (page, limit, field, word) => {
  try {
    const filter = { status: { $ne: "deleted" } };
    if (field && word) {
      filter[field] = RegExp(word, "iu");
    }
    const totalCount = await Category.countDocuments(filter);
    const result = await Category.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalPage = Math.ceil(totalCount / limit);
    return {
      code: 200,
      message: "Thành công",
      totalCount,
      totalPage,
      data: result,
    };
  } catch (error) {
    console.log("Error in get all cateogry", error);
    return {
      code: 500,
      message: "Đã xảy ra lỗi máy chủ",
      totalCount: 0,
      totalPage: 0,
      data: null,
    };
  }
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

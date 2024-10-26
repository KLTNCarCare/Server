const { get } = require("mongoose");
const {
  createCategory,
  delCategory,
  updateCategory,
  getTotalCategory,
  findAllCategory,
  inactiveCategoryById,
  activeCategoryById,
} = require("../services/category.service");

const saveCategory = async (req, res) => {
  try {
    const category = req.body;
    const result = await createCategory(category);
    if (!result) {
      return res.status(400).json({ message: "Failed to save category" });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.log("Error in saveCategory", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteCategory = async (req, res) => {
  const id = req.params.id;
  const result = await delCategory(id);
  return res.status(result.code).json(result);
};

const inactiveCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await inactiveCategoryById(id);
    if (!result) {
      return res.status(400).json({ message: "Failed to inactive category" });
    }
    return res.status(200).json({ message: "Category inactive successfully" });
  } catch (error) {
    console.log("Error in inactiveCategory", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const activeCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await activeCategoryById(id);
    if (!result) {
      return res.status(400).json({ message: "Failed to inactive category" });
    }
    return res.status(200).json({ message: "Category inactive successfully" });
  } catch (error) {
    console.log("Error in inactiveCategory", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const category = req.body;
    const result = await updateCategory(id, category);
    if (!result) {
      return res.status(400).json({ message: "Failed to update category" });
    }
    return res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.log("Error in updateCategory", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllCategories = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const field = req.query.field;
  const word = req.query.word;
  const result = await findAllCategory(page, limit, field, word);
  return res.status(result.code).json(result);
};
module.exports = {
  saveCategory,
  deleteCategory,
  editCategory,
  getAllCategories,
  inactiveCategory,
  activeCategory,
};

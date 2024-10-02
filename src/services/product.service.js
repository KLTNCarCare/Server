const Product = require("../models/product.model");
const { generateID } = require("./lastID.service");

const createProdcut = async (product) => {
  product.productId = await generateID("SP");
  return await Product.create(product);
};

const deleteProduct = async (id) =>
  Product.findOneAndUpdate({ _id: id }, { status: "inactive" }, { new: true });

const updateProduct = async (id, product) =>
  await Product.findOneAndUpdate({ _id: id }, product, { new: true });

const getProductByCategory = async (categoryId, page, limit) =>
  await Product.find({ categoryId: categoryId })
    .skip((page - 1) * limit)
    .limit(limit);

const getTotalPage = async (categoryId, limit) => {
  const count = await Product.countDocuments({
    status: "active",
    categoryId: categoryId,
  });
  return Math.ceil(count / limit);
};
module.exports = {
  createProdcut,
  deleteProduct,
  updateProduct,
  getProductByCategory,
  getTotalPage,
};

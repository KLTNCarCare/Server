const {
  createProdcut,
  deleteProduct,
  updateProduct,
  getProductByCategory,
  getTotalPage,
} = require("../services/product.service");

const saveProduct = async (req, res) => {
  try {
    const product = req.body;
    const result = await createProdcut(product);
    if (!result) {
      return res.status(500).json({ message: "Create product unsuccessfull" });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.log("Error in saveProdcut", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};

const removeProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deleteProduct(id);
    if (!result) {
      return res.status(500).json({ message: "Unsuccessful" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in removeProduct", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { productName, unit, manufacturer } = req.body;
    const result = await updateProduct(id, { productName, unit, manufacturer });
    if (!result) {
      return res.status(500).json({ message: "Unsuccessful" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in editProduct", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
const getAllProduct = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPage = await getTotalPage(categoryId, limit);
    const result = await getProductByCategory(categoryId, page, limit);
    if (!result) {
      return res.status(500).json({ message: "Unsuccessful" });
    }
    return res.status(200).json({ data: result, totalPage });
  } catch (error) {
    console.log("Error in getProductByCategory", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
module.exports = {
  saveProduct,
  removeProduct,
  editProduct,
  getAllProduct,
};

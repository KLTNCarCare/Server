const {
  createEmployeeService,
  createEmp,
  updateEmp,
  getEmpById,
} = require("../services/employee.service");
const createEmployee = async (req, res) => {
  try {
    const { fullName, phoneNumber, personId, dob, email, address } = req.body;
    if (!fullName || !phoneNumber || !personId) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const employee = {
      fullName,
      phoneNumber,
      personId,
      dob,
      email,
      address,
    };
    const result = await createEmp(employee);
    if (!result) {
      return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.log("Error in createEmployee", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
// update name,email,address,persionId,dob,phoneNumber
const updateEmployee = async (req, res) => {
  try {
    const id = await getEmpById(req.params.id);
    if (!id) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employee = req.body;
    employee.updatedAt = new Date();
    const result = await updateEmp(id, employee);
    if (!result) {
      return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in updateEmployee", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi máy chủ" });
  }
};
module.exports = {
  createEmployee,
  updateEmployee,
};

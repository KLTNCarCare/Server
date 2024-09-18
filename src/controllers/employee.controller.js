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
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(201).json(result);
  } catch (error) {
    console.log("Error in createEmployee", error);
    return res.status(500).json({ message: "Internal server error" });
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
    delete employee.empId; // not allow to update empId
    delete employee._id; // not allow to update _id
    delete employee.createdAt; // not allow to update createdAt
    delete employee.updatedAt; // not allow to update updatedAt
    delete employee.status; // not allow to update status
    employee.remove;
    const result = await updateEmp(id, employee);
    if (!result) {
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.log("Error in updateEmployee", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  createEmployee,
  updateEmployee,
};

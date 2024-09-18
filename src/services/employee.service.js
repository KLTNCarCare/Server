const Employee = require("../models/employee.model");
const { generateID } = require("./lastID.service");
const createEmp = async (employee) => {
  employee.empId = await generateID("NV");
  return await Employee.create(employee);
};
const deleleEmp = async (id) =>
  await Employee.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
const updateEmp = async (id, newEmp) =>
  await Employee.findByIdAndUpdate(id, newEmp, { new: true });
const getEmpById = async (id) => await Employee.findById(id);
module.exports = {
  createEmp,
  deleleEmp,
  updateEmp,
  getEmpById,
};

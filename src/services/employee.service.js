const Employee = require("../models/employee.model");
const { generateID } = require("./lastID.service");
const createEmployeeService = async (employee) => {
    try {
        employee.empId = await generateID("NV");
        return await Employee.create(employee);
    } catch (error) {
        console.log("Error at createEmployee: ", error);
        return null;
    }
};
const getEmpByIdService = async (empId) => {
    try{
        return await Employee.findOne({empId});
    }catch(error){
        console.log("Error at getEmpByIdService: ", error);
        return null;
    }
}
module.exports = {
    createEmployeeService,
    getEmpByIdService,
};

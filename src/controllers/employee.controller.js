const {generateID} = require("../services/lastID.service");
const{createEmployeeService} = require("../services/employee.service");
const createEmployee = async (req, res) => {
    
    const employee  = req.body;
    if(!employee) return res.status(400).json({message: "Missing employee information"});
    // create id for employee
    const empId = await generateID("NV");
    employee.empId = empId;
    if(!empId) return res.status(500).json({message: "Internal Server Error"});

    // create employee
    const result = await createEmployeeService(employee);
    if(!result) return res.status(500).json({message: "Internal Server Error"});

    return res.status(201).json(result);
}
module.exports = {
    createEmployee
};
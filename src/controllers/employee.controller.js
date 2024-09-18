const{createEmployeeService} = require("../services/employee.service");
const createEmployee = async (req, res) => {
    
    const employee  = req.body;
    if(!employee) return res.status(400).json({message: "Missing employee information"});

    // create employee
    const result = await createEmployeeService(employee);
    if(!result) return res.status(500).json({message: "Internal Server Error"});

    return res.status(201).json(result);
}
module.exports = {
    createEmployee
};
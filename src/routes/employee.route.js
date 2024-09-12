const {createEmployee} = require('../controllers/employee.controller');
const router = require('express').Router();

router.post('/create-employee',createEmployee);
module.exports = router;
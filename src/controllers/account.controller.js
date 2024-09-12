const {createAccountService} = require("../services/account.service");
const sendHello = (req, res) => {  
    console.log(req.body);
    
    const {username,password} = req.body;
    return res.status(200).json({username,password});
    };
const createAccountEmp = async (req, res) => {
    const {username,password} = req.body;
    if(!username || !password){
        return res.status(400).json({message:"Bad request"});
    }

    const result = await createAccountService(username,password,"staff");
    if(!result){
        return res.status(500).json({message:"Internal Server Error"});
    }
    return res.status(201).json({message:"Create account success"});
    }
module.exports = { sendHello,
    createAccountEmp
 };
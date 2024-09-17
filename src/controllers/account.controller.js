import { createAccountService } from '../services/account.service.js';

const sendHello = (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;
    return res.status(200).json({ username, password });
};

const createAccount = async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);
    const data = await createAccountService(username, password);
    return res.json(data);
};

export { sendHello, createAccount };
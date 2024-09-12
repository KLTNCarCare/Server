require("dotenv").config();
const jwt = require("jsonwebtoken");

const auth = (roles)=>{
  return (req,res,next)=>{
  try {
    const token = req?.headers?.authorization?.split(" ")?.[1];
    if(!token){
      return res.status(401).json('Unauthorized');
    }
    const payload = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    if(roles.includes(payload.role)){
      req.user = payload;
      next();
    }else{
      return res.status(403).json('Forbidden');
    }
  } catch (error) {
    console.log("Error verify token at auth middleware ",error);
    return res.status(401).json('Unauthorized');
  }
}}
module.exports = auth;

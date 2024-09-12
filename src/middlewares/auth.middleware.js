require("dotenv").config();
const jwt = require("jsonwebtoken");
const { decode } = require("../services/auth.service");

const authMiddleware = (req, res, next) => {
  const whiteList = ["/auth/sign-in", "/auth/register", "/auth/refresh-token"];
  if (whiteList.find((url) => "/v1/api" + url === req.originalUrl)) {
    next();
  } else {
    if (req?.headers?.authorization?.split(" ")?.[1]) {
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
          return res.status(401).json("Unauthorized");
        }
      });
    } else {
      return res.status(401).json("Unauthorized");
    }
    next();
  }
};

module.exports = authMiddleware;

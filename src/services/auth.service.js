const jwt = require("jsonwebtoken");

const getSecondLeftToken = (token) => {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp) {
    const currentTime = Math.floor(Date.now() / 1000); //đơn vị giây
    const timeLeft = decoded.exp - currentTime;
    return timeLeft;
  }
};
module.exports = { getSecondLeftToken };

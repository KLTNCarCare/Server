const createPayment = async (req, res) => {
  const id = req.params.id;
  const vnp_IpAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
};
module.exports = {
  createPayment,
};

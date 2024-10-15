const formatCurrency = (num) => num.toLocaleString("ko-KR");
const getStringClockToDate = (date) => {
  const hour = date.getHours();
  const min = date.getMinutes();
  const hour_template = hour < 10 ? "0" + hour : hour;
  const min_template = min < 10 ? "0" + min : min;
  return hour_template + ":" + min_template;
};
module.exports = { formatCurrency, getStringClockToDate };

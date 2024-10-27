const formatCurrency = (num) => num.toLocaleString("ko-KR");
const getStringClockToDate = (d) => {
  const date = new Date(d);
  const hour = date.getHours();
  const min = date.getMinutes();
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const hour_template = hour < 10 ? "0" + hour : hour;
  const min_template = min < 10 ? "0" + min : min;
  return (
    hour_template +
    ":" +
    min_template +
    " ngày " +
    day +
    "-" +
    month +
    "-" +
    year
  );
};
module.exports = { formatCurrency, getStringClockToDate };

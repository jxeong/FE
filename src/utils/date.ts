export const formatExcelTimestamp = () => {
  const d = new Date();

  const yy = String(d.getFullYear()).slice(2); // 25
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${yy}${mm}${dd}_${hh}${mi}${ss}`;
};
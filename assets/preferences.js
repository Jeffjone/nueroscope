/* Apply saved display choices before first paint; storage can be unavailable. */
(() => {
  try {
    const p = JSON.parse(
      localStorage.getItem("neuroscope:preferences") || "{}",
    );
    document.documentElement.classList.toggle("large-text", p.large === true);
    document.documentElement.classList.toggle("calm-mode", p.calm === true);
  } catch {
    /* Browser defaults remain usable in private or restricted contexts. */
  }
})();

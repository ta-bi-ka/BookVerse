document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => {
    const fallback = button.dataset.fallback || "/pages/public/index.html";

    try {
      const previousPage = new URL(document.referrer);

      if (
        previousPage.origin === window.location.origin &&
        window.history.length > 1
      ) {
        window.history.back();
        return;
      }
    } catch {
      // The page was opened directly, so use its fallback.
    }

    window.location.assign(fallback);
  });
});
(() => {
  const status = document.getElementById("fines-status");
  const list = document.getElementById("fines-list");

  if (!status || !list) return;

  async function loadFines() {
    try {
      const response = await fetch("/api/fines/my", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(result.message || "Could not load your fines.");
      }

      if (!Array.isArray(result.data)) {
        throw new Error("The server returned an unexpected fines list.");
      }

      list.replaceChildren();

      if (result.data.length === 0) {
        status.textContent = "You have no fines.";
        return;
      }

      status.textContent =
        `${result.data.length} fine(s). ` +
        `Unpaid total: ${Number(result.unpaidTotal || 0).toFixed(2)}`;

      for (const fine of result.data) {
        const card = document.createElement("article");
        card.className = "book-card";

        const heading = document.createElement("h3");
        heading.textContent = fine.title || `Fine #${fine.fine_id}`;

        const reason = document.createElement("p");
        reason.textContent = `Reason: ${fine.reason}`;

        const amount = document.createElement("p");
        amount.textContent =
          `Amount: ${Number(fine.amount).toFixed(2)}`;

        const payment = document.createElement("p");
        payment.textContent =
          `Status: ${fine.is_paid ? "Paid" : "Unpaid"}`;

        card.append(heading, reason, amount, payment);
        list.appendChild(card);
      }
    } catch (error) {
      status.textContent = error.message;
    }
  }

  loadFines();
})();
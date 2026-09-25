(() => {
  const status = document.getElementById("fine-status");
  const form = document.getElementById("fine-form");
  const borrowSelect = document.getElementById("fine-borrow");
  const amountInput = document.getElementById("fine-amount");
  const reasonInput = document.getElementById("fine-reason");
  const createButton = document.getElementById("create-fine");
  const list = document.getElementById("fine-list");

  let borrows = [];
  let fines = [];

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
    });

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(result.message || "The request failed.");
    }

    return result.data;
  }

  function text(card, value) {
    const paragraph = document.createElement("p");
    paragraph.textContent = value;
    card.appendChild(paragraph);
  }

  function renderBorrowOptions() {
    borrowSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a borrowing record";
    borrowSelect.appendChild(placeholder);

    const finedBorrowIds = new Set(
      fines.map((fine) => Number(fine.borrow_id))
    );

    for (const borrow of borrows) {
      if (finedBorrowIds.has(Number(borrow.borrow_id))) continue;

      const option = document.createElement("option");
      option.value = borrow.borrow_id;
      option.textContent =
        `#${borrow.borrow_id} — ${borrow.title} — ` +
        `${borrow.full_name} (@${borrow.username})`;
      borrowSelect.appendChild(option);
    }
  }

  function renderFines() {
    list.replaceChildren();

    if (fines.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No fines have been recorded.";
      list.appendChild(empty);
      return;
    }

    for (const fine of fines) {
      const card = document.createElement("article");
      card.className = "book-card";

      const heading = document.createElement("h3");
      heading.textContent = fine.title || `Borrow #${fine.borrow_id}`;
      card.appendChild(heading);

      text(card, `Student: ${fine.full_name} (@${fine.username})`);
      text(card, `Borrow ID: ${fine.borrow_id}`);
      text(card, `Reason: ${fine.reason}`);
      text(card, `Amount: ${Number(fine.amount).toFixed(2)}`);
      text(card, `Status: ${fine.is_paid ? "Paid" : "Unpaid"}`);

      if (!fine.is_paid) {
        const paidButton = document.createElement("button");
        paidButton.type = "button";
        paidButton.className = "nav-logout";
        paidButton.textContent = "Mark as paid";

        paidButton.addEventListener("click", async () => {
          if (!window.confirm(
            "Have you received this payment? Mark this fine as paid?"
          )) {
            return;
          }

          paidButton.disabled = true;
          status.textContent = "Updating payment status...";

          try {
            await api(`/api/fines/${fine.fine_id}/payment`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paid: true }),
            });

            await loadData();
            status.textContent = "Fine marked as paid.";
          } catch (error) {
            status.textContent = error.message;
            paidButton.disabled = false;
          }
        });

        card.appendChild(paidButton);
      }

      list.appendChild(card);
    }
  }

  async function loadData() {
    const [borrowData, fineData] = await Promise.all([
      api("/api/borrows"),
      api("/api/fines"),
    ]);

    if (!Array.isArray(borrowData) || !Array.isArray(fineData)) {
      throw new Error("The server returned an unexpected response.");
    }

    borrows = borrowData;
    fines = fineData;

    renderBorrowOptions();
    renderFines();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (createButton.disabled) return;

    createButton.disabled = true;
    status.textContent = "Creating fine...";

    try {
      await api("/api/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowId: Number(borrowSelect.value),
          amount: amountInput.value,
          reason: reasonInput.value.trim(),
        }),
      });

      form.reset();
      await loadData();
      status.textContent = "Fine created successfully.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      createButton.disabled = false;
    }
  });

  async function start() {
    try {
      const session = await api("/api/auth/session");

      if (!["Librarian", "Admin"].includes(session.roleName)) {
        status.textContent = "Staff permission is required.";
        return;
      }

      await loadData();
      form.hidden = false;
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
    }
  }

  start();
})();
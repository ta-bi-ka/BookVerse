(() => {
  const list = document.getElementById("review-list");
  const status = document.getElementById("review-status");
  const refresh = document.getElementById("refresh-requests");

  const endpoint = "/api/borrows/requests";

  const typeLabels = {
    borrow: "Borrow",
    return: "Return",
    renew: "Renewal",
  };

  let busy = false;

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
    });

    if (response.status === 401) {
      throw new Error(
        "Please log in with your Librarian account."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Librarian permission is required. If you were just approved, log out and log in again."
      );
    }

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(
        response.status >= 500
          ? "The server could not complete this request."
          : result.message || "The request failed."
      );
    }

    return result;
  }

  function setBusy(value) {
    busy = value;
    refresh.disabled = value;

    list.querySelectorAll("button, input").forEach((element) => {
      // Keep buttons blocked by queue position or availability
      // disabled after a request finishes.
      element.disabled =
        value || element.dataset.blocked === "true";
    });
  }

  function formatDate(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleString();
  }

  function cell(text) {
    const td = document.createElement("td");
    td.textContent = text ?? "—";
    return td;
  }

  function makeActionButton(label, entry, action, reasonInput) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;

    if (action === "decline") {
      button.className = "secondary-button";
    }

    button.addEventListener("click", () => {
      review(
        entry,
        action,
        action === "decline"
          ? reasonInput.value.trim() || null
          : null
      );
    });

    return button;
  }

  function renderRequests(requests) {
  list.replaceChildren();

  const borrowRequests = requests.filter(
    (entry) => entry.request_type === "borrow"
  );

  const returnRenewRequests = requests.filter(
    (entry) =>
      entry.request_type === "return" ||
      entry.request_type === "renew"
  );

  function addSection(title, entries, isBorrowSection) {
    if (entries.length === 0) return;

    const section = document.createElement("section");

    const sectionHeading = document.createElement("h2");
    sectionHeading.textContent = title;
    section.appendChild(sectionHeading);

    const bookGroups = new Map();

    for (const entry of entries) {
      if (!bookGroups.has(entry.book_id)) {
        bookGroups.set(entry.book_id, []);
      }

      bookGroups.get(entry.book_id).push(entry);
    }

    for (const bookRequests of bookGroups.values()) {
      const bookSection = document.createElement("section");
      bookSection.className = isBorrowSection
        ? "request-book-section"
        : "request-book-section loan-request-book";

      const bookHeading = document.createElement("h3");
      bookHeading.textContent =
        bookRequests[0].title || "Untitled book";

      bookSection.appendChild(bookHeading);

      const available = Number(
        bookRequests[0].available_copies
      );

      const availableCount = Number.isFinite(available)
        ? available
        : 0;

      if (isBorrowSection) {
        const availability = document.createElement("p");
        availability.textContent =
          `${availableCount} ${
            availableCount === 1 ? "copy" : "copies"
          } available`;

        bookSection.appendChild(availability);
      }

      if (isBorrowSection) {
        bookRequests.sort(
          (a, b) =>
            Number(a.queue_position) -
            Number(b.queue_position)
        );
      } else {
        bookRequests.sort(
          (a, b) =>
            new Date(a.requested_on) -
              new Date(b.requested_on) ||
            Number(a.request_id) -
              Number(b.request_id)
        );
      }

      const tableWrapper = document.createElement("div");
      tableWrapper.className = "request-table-scroll";

      const table = document.createElement("table");
      table.className = "request-table";

      const caption = document.createElement("caption");
      caption.textContent =
        `${title} for ${bookHeading.textContent}`;

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      for (const label of [
        "Position",
        "Student",
        "Request",
        "Submitted",
        "Decision",
      ]) {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = label;
        headerRow.appendChild(th);
      }

      thead.appendChild(headerRow);

      const tbody = document.createElement("tbody");

      for (const entry of bookRequests) {
        const row = document.createElement("tr");

        row.appendChild(
          cell(
            isBorrowSection
              ? entry.queue_position
              : "—"
          )
        );

        const studentCell =
          document.createElement("td");

        const studentName =
          document.createElement("strong");
        studentName.textContent =
          entry.full_name || "Student";

        const username =
          document.createElement("div");
        username.textContent = entry.username
          ? `@${entry.username}`
          : "";

        studentCell.append(
          studentName,
          username
        );

        row.appendChild(studentCell);

        row.appendChild(
          cell(
            typeLabels[entry.request_type] ||
              entry.request_type
          )
        );

        row.appendChild(
          cell(formatDate(entry.requested_on))
        );

        const decisionCell =
          document.createElement("td");

        const controls =
          document.createElement("div");
        controls.className =
          "request-row-actions";

        const reason =
          document.createElement("input");
        reason.type = "text";
        reason.maxLength = 500;
        reason.placeholder =
          "Decline reason (optional)";
        reason.setAttribute(
          "aria-label",
          `Optional decline reason for ${
            entry.full_name || "student"
          }`
        );

        const approve = makeActionButton(
          "Approve",
          entry,
          "approve",
          reason
        );

        const decline = makeActionButton(
          "Decline",
          entry,
          "decline",
          reason
        );

        if (isBorrowSection) {
          if (
            Number(entry.queue_position) !== 1
          ) {
            approve.dataset.blocked = "true";
            approve.disabled = true;
            approve.title =
              "This student is not first in the borrow queue.";
          } else if (availableCount < 1) {
            approve.dataset.blocked = "true";
            approve.disabled = true;
            approve.title =
              "No copy is available yet.";
          }
        }

        controls.append(approve, decline);
        decisionCell.append(
          controls,
          reason
        );

        row.appendChild(decisionCell);
        tbody.appendChild(row);
      }

      table.append(
        caption,
        thead,
        tbody
      );

      tableWrapper.appendChild(table);
      bookSection.appendChild(tableWrapper);
      section.appendChild(bookSection);
    }

    list.appendChild(section);
  }

  addSection(
    "Borrow requests",
    borrowRequests,
    true
  );

  addSection(
    "Return and renewal requests",
    returnRenewRequests,
    false
  );
}

  async function loadRequests() {
    if (busy) return;

    setBusy(true);
    list.replaceChildren();
    status.textContent = "Loading requests...";

    try {
      const result = await apiRequest(
        `${endpoint}/pending`
      );

      if (!Array.isArray(result.data)) {
        throw new Error(
          "The server returned an unexpected response."
        );
      }

      renderRequests(result.data);

      status.textContent = result.data.length
        ? `${result.data.length} pending request(s).`
        : "No pending requests.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  }

  async function review(entry, action, reason) {
    if (busy) return;

    const type =
      typeLabels[entry.request_type] ||
      entry.request_type;

    let message =
      `${action === "approve" ? "Approve" : "Decline"} ` +
      `this ${type.toLowerCase()} request from ` +
      `${entry.full_name}?`;

    if (
      action === "approve" &&
      entry.request_type === "return"
    ) {
      message +=
        "\nOnly approve after receiving the physical book.";
    }

    if (!window.confirm(message)) return;

    setBusy(true);
    status.textContent = "Saving your decision...";

    let saved = false;

    try {
      await apiRequest(
        `${endpoint}/${encodeURIComponent(
          entry.request_id
        )}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            action === "decline" ? { reason } : {}
          ),
        }
      );

      saved = true;
    } catch (error) {
      status.textContent =
        `${error.message} Refresh the list if availability changed.`;
    } finally {
      setBusy(false);
    }

    if (saved) {
      // Approval or decline can change queue positions or
      // the number of available copies.
      await loadRequests();
    }
  }

  refresh.addEventListener("click", loadRequests);
  loadRequests();
})();
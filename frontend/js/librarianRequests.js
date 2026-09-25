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

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
    });

    if (response.status === 401) {
      throw new Error("Please log in with your Librarian account.");
    }

    if (response.status === 403) {
      throw new Error(
        "Librarian permission is required. If your application was just approved, log out and log in again."
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
      element.disabled = value;
    });
  }

  function addDetail(card, label, value) {
    const paragraph = document.createElement("p");
    paragraph.textContent = `${label}: ${value ?? "Not provided"}`;
    card.appendChild(paragraph);
  }

  function renderRequests(requests) {
    list.replaceChildren();

    requests.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "book-card";

      const heading = document.createElement("h3");
      heading.textContent = entry.title;
      card.appendChild(heading);

      addDetail(
        card,
        "Request",
        typeLabels[entry.request_type] || entry.request_type
      );
      addDetail(card, "Student", entry.full_name);
      addDetail(card, "Username", entry.username);
      addDetail(card, "Status", "Pending");

      const date = new Date(entry.requested_on);
      addDetail(
        card,
        "Submitted",
        Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString()
      );

      const field = document.createElement("div");
      field.className = "form-field";
      field.style.marginTop = "16px";

      const reason = document.createElement("input");
      reason.id = `request-reason-${entry.request_id}`;
      reason.type = "text";
      reason.maxLength = 500;

      const label = document.createElement("label");
      label.htmlFor = reason.id;
      label.textContent = "Decline reason (optional)";

      field.append(label, reason);
      card.appendChild(field);

      const controls = document.createElement("div");
      controls.className = "search-controls";
      controls.style.marginTop = "16px";

      const approve = document.createElement("button");
      approve.type = "button";
      approve.textContent = "Approve";

      const decline = document.createElement("button");
      decline.type = "button";
      decline.className = "secondary-button";
      decline.textContent = "Decline";

      approve.addEventListener("click", () => {
        review(entry, "approve", null, card);
      });

      decline.addEventListener("click", () => {
        review(entry, "decline", reason.value.trim() || null, card);
      });

      controls.append(approve, decline);
      card.appendChild(controls);
      list.appendChild(card);
    });
  }

  async function loadRequests() {
    if (busy) return;

    setBusy(true);
    list.replaceChildren();
    status.textContent = "Loading requests...";

    try {
      const result = await request(`${endpoint}/pending`);

      if (!Array.isArray(result.data)) {
        throw new Error("The server returned an unexpected response.");
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

  async function review(entry, action, reason, card) {
    if (busy) return;

    const type = typeLabels[entry.request_type] || entry.request_type;
    let message =
      `${action === "approve" ? "Approve" : "Decline"} this ` +
      `${type.toLowerCase()} request from ${entry.full_name}?`;

    if (action === "approve" && entry.request_type === "return") {
      message += "\nOnly approve after receiving the physical book.";
    }

    if (!window.confirm(message)) return;

    setBusy(true);
    status.textContent = "Saving your decision...";

    try {
      const result = await request(
        `${endpoint}/${entry.request_id}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "decline" ? { reason } : {}),
        }
      );

      card.remove();
      status.textContent = result.message;

      if (list.children.length === 0) {
        status.textContent += " No pending requests remain.";
      }
    } catch (error) {
      status.textContent =
        `${error.message} Refresh the list before trying again.`;
    } finally {
      setBusy(false);
    }
  }

  refresh.addEventListener("click", loadRequests);
  loadRequests();
})();
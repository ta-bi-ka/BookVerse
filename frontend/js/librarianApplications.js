(() => {
  const list = document.getElementById("applications-list");
  const status = document.getElementById("applications-status");
  const refresh = document.getElementById("refresh-applications");

  const endpoint = "/api/admin/librarian-applications";
  let busy = false;

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
    });

    if (response.status === 401) {
      throw new Error("Please log in with your Admin account.");
    }

    if (response.status === 403) {
      throw new Error("An authorised Admin account is required.");
    }

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(
        response.status >= 500
          ? "The server could not complete this request. Please try again."
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

  function renderApplications(applications) {
    list.replaceChildren();

    applications.forEach((application) => {
      const card = document.createElement("article");
      card.className = "book-card";

      const heading = document.createElement("h3");
      heading.textContent = application.full_name;
      card.appendChild(heading);

      addDetail(card, "Username", application.username);
      addDetail(card, "Email", application.email);
      addDetail(card, "Status", application.status);

      const date = new Date(application.requested_on);
      addDetail(
        card,
        "Applied",
        Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString()
      );

      const field = document.createElement("div");
      field.className = "form-field";
      field.style.marginTop = "16px";

      const reasonId = `reason-${application.application_id}`;

      const label = document.createElement("label");
      label.htmlFor = reasonId;
      label.textContent = "Decline reason (optional)";

      const reason = document.createElement("input");
      reason.id = reasonId;
      reason.type = "text";
      reason.maxLength = 500;

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
        review(application, "approve", null, card);
      });

      decline.addEventListener("click", () => {
        review(application, "decline", reason.value.trim() || null, card);
      });

      controls.append(approve, decline);
      card.appendChild(controls);
      list.appendChild(card);
    });
  }

  async function loadApplications() {
    if (busy) return;

    setBusy(true);
    list.replaceChildren();
    status.textContent = "Loading applications...";

    try {
      const result = await request(endpoint);

      if (!Array.isArray(result.data)) {
        throw new Error("The server returned an unexpected response.");
      }

      renderApplications(result.data);
      status.textContent = result.data.length
        ? `${result.data.length} pending application(s).`
        : "No pending applications.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  }

  async function review(application, action, reason, card) {
    if (busy) return;

    const confirmed = window.confirm(
      `${action === "approve" ? "Approve" : "Decline"} the application from ${application.full_name}?`
    );

    if (!confirmed) return;

    setBusy(true);
    status.textContent = "Saving your decision...";

    try {
      const result = await request(
        `${endpoint}/${application.application_id}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "decline" ? { reason } : {}),
        }
      );

      card.remove();
      status.textContent = result.message;

      if (list.children.length === 0) {
        status.textContent += " No pending applications remain.";
      }
    } catch (error) {
      status.textContent =
        `${error.message} Refresh the list before trying again.`;
    } finally {
      setBusy(false);
    }
  }

  refresh.addEventListener("click", loadApplications);
  loadApplications();
})();
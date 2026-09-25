const borrowsStatus = document.getElementById("borrows-status");
const borrowsList = document.getElementById("borrows-list");

function formatBorrowDate(value) {
  if (!value) return "Not returned";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function addBorrowDetail(list, label, value) {
  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = String(value ?? "Not available");

  list.append(term, description);
}

async function loadMyBorrows() {
  borrowsStatus.textContent = "Loading your borrowing history...";
  borrowsList.replaceChildren();

  try {
    const response = await fetch("/api/borrows/my", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) {
      window.location.replace("/pages/public/login.html");
      return;
    }

    if (response.status === 403) {
      borrowsStatus.textContent =
        "This page is available to Student accounts only.";
      return;
    }

    const result = await response.json();

    if (
      !response.ok ||
      result.success !== true ||
      !Array.isArray(result.data)
    ) {
      throw new Error("Unexpected borrowing history response");
    }

    if (result.data.length === 0) {
      borrowsStatus.textContent = "You have not borrowed any books yet.";
      return;
    }

    const fragment = document.createDocumentFragment();

    result.data.forEach((borrow) => {
      const card = document.createElement("article");
      card.className = "borrow-record";

      const heading = document.createElement("h3");
      const link = document.createElement("a");
      link.className = "book-title-link";
      link.href =
        `/pages/public/book-details.html?id=${encodeURIComponent(borrow.book_id)}`;
      link.textContent = borrow.title || "Untitled book";
      heading.appendChild(link);

      const details = document.createElement("dl");
      details.className = "book-information";

      addBorrowDetail(
        details,
        "Status",
        borrow.return_date ? "Returned" : "On loan"
      );
      addBorrowDetail(
        details,
        "Borrowed",
        formatBorrowDate(borrow.borrow_date)
      );
      addBorrowDetail(
        details,
        "Due date",
        formatBorrowDate(borrow.due_date)
      );
      addBorrowDetail(
        details,
        "Returned",
        formatBorrowDate(borrow.return_date)
      );
      addBorrowDetail(details, "Renewals", borrow.renew_count);
      addBorrowDetail(details, "Copy barcode", borrow.barcode);

      card.append(heading, details);
      if (!borrow.return_date) {
        const returnButton = document.createElement("button");
        returnButton.type = "button";
        returnButton.className = "auth-button";
        returnButton.textContent = "Request return";
        returnButton.style.marginTop = "20px";

        const returnStatus = document.createElement("p");
        returnStatus.setAttribute("role", "status");

        returnButton.addEventListener("click", async () => {
          const confirmed = window.confirm(
            `Return "${borrow.title || "this book"}"?`
          );

          if (!confirmed) return;

          returnButton.disabled = true;
          returnButton.textContent = "Submitting request...";
          returnStatus.textContent = "";

          try {
            const response = await fetch(
              `/api/borrows/${encodeURIComponent(borrow.borrow_id)}/return`,
              {
                method: "POST",
                credentials: "same-origin",
              }
            );

            if (response.status === 401) {
              window.location.assign("/pages/public/login.html");
              return;
            }

            const result = await response.json();

            if (!response.ok || result.success !== true) {
              if (response.status >= 500) {
                returnStatus.textContent =
                  "Could not confirm the return. Refresh this page to check the loan before retrying.";
                returnButton.textContent = "Check loan status";
              } else {
                returnStatus.textContent =
                  result.message || "This book could not be returned.";
                returnButton.disabled = false;
                returnButton.textContent = "Request return";
              }
              return;
            }

            // Reload the history to display the saved return date.
            returnButton.disabled = true;
            renewButton.disabled = true;

            returnButton.textContent = "Request pending";
            renewButton.textContent = "Awaiting librarian";

            returnStatus.textContent = result.message;
            await loadMyRequests();
          } catch (error) {
            returnStatus.textContent =
              "Could not confirm the return. Refresh this page to check the loan before retrying.";
            returnButton.textContent = "Check loan status";
          }
        });

        card.append(returnButton, returnStatus);
        const renewButton = document.createElement("button");
        renewButton.type = "button";
        renewButton.className = "auth-button";
        renewButton.textContent = "Request renewal";
        renewButton.style.marginTop = "12px";

        renewButton.addEventListener("click", async () => {
          if (returnButton.disabled || renewButton.disabled) return;

          const confirmed = window.confirm(
            `Request a renewal for "${borrow.title || "this book"}"?`
          );

          if (!confirmed) return;

          // Prevent returning the same loan while renewal is processing.
          renewButton.disabled = true;
          returnButton.disabled = true;
          renewButton.textContent = "Submitting request...";
          returnStatus.textContent = "";

          try {
            const response = await fetch(
              `/api/borrows/${encodeURIComponent(borrow.borrow_id)}/renew`,
              {
                method: "POST",
                credentials: "same-origin",
              }
            );

            if (response.status === 401) {
              window.location.assign("/pages/public/login.html");
              return;
            }

            const result = await response.json();

            if (!response.ok || result.success !== true) {
              if (response.status >= 500) {
                returnStatus.textContent =
                  "Could not confirm renewal. Refresh this page to check the due date and renewal count before retrying.";
                renewButton.textContent = "Check loan status";
              } else {
                returnStatus.textContent =
                  result.message || "This loan could not be renewed.";
                renewButton.disabled = false;
                returnButton.disabled = false;
                renewButton.textContent = "Request renewal";
              }
              return;
            }

            // Reload the saved due date and renewal count.
            returnButton.disabled = true;
            renewButton.disabled = true;

            returnButton.textContent = "Request pending";
            renewButton.textContent = "Awaiting librarian";

            returnStatus.textContent = result.message;
            await loadMyRequests();
          } catch (error) {
            returnStatus.textContent =
              "Could not confirm renewal. Refresh this page to check the due date and renewal count before retrying.";
            renewButton.textContent = "Check loan status";
          }
        });

        card.appendChild(renewButton);
      }
      fragment.appendChild(card);
    });

    borrowsList.appendChild(fragment);

    const count = result.data.length;
    borrowsStatus.textContent =
      `${count} borrowing ${count === 1 ? "record" : "records"}.`;
  } catch (error) {
    borrowsStatus.textContent =
      "Could not load your borrowing history. Please refresh and try again.";
  }
}

loadMyBorrows();
const requestsStatus = document.getElementById("requests-status");
const requestsList = document.getElementById("requests-list");

async function loadMyRequests() {
  requestsStatus.textContent = "Loading requests...";
  requestsList.replaceChildren();

  try {
    const response = await fetch("/api/borrows/requests/my", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) {
      window.location.replace("/pages/public/login.html");
      return;
    }

    if (response.status === 403) {
      requestsStatus.textContent =
        "Borrowing requests are available to Student accounts only.";
      return;
    }

    const result = await response.json();

    if (
      !response.ok ||
      result.success !== true ||
      !Array.isArray(result.data)
    ) {
      throw new Error("Could not load requests");
    }

    if (result.data.length === 0) {
      requestsStatus.textContent = "You have no borrowing requests yet.";
      return;
    }

    const typeLabels = {
      borrow: "Borrow",
      return: "Return",
      renew: "Renewal",
    };

    const statusLabels = {
      pending: "Pending",
      approved: "Approved",
      declined: "Declined",
    };

    const fragment = document.createDocumentFragment();

    result.data.forEach((request) => {
      const card = document.createElement("article");
      card.className = "book-card";
      card.style.marginBottom = "16px";

      const heading = document.createElement("h3");
      heading.textContent = request.title || "Untitled book";

      const details = document.createElement("dl");
      details.className = "book-information";

      addBorrowDetail(
        details,
        "Request",
        typeLabels[request.request_type] || request.request_type
      );

      addBorrowDetail(
        details,
        "Status",
        statusLabels[request.status] || request.status
      );

      addBorrowDetail(
        details,
        "Submitted",
        request.requested_on
          ? formatBorrowDate(request.requested_on)
          : "Not available"
      );

      if (request.reviewed_on) {
        addBorrowDetail(
          details,
          "Reviewed",
          formatBorrowDate(request.reviewed_on)
        );
      }

      if (request.decision_reason) {
        addBorrowDetail(details, "Reason", request.decision_reason);
      }

      card.append(heading, details);
      fragment.appendChild(card);
    });

    requestsList.appendChild(fragment);

    const count = result.data.length;
    requestsStatus.textContent =
      `${count} ${count === 1 ? "request" : "requests"}.`;
  } catch (error) {
    requestsStatus.textContent =
      "Could not load your requests. Please refresh and try again.";
  }
}

loadMyRequests();
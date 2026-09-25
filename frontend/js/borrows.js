const borrowsStatus = document.getElementById("borrows-status");
const borrowsList = document.getElementById("borrows-list");
const requestsStatus = document.getElementById("requests-status");
const requestsList = document.getElementById("requests-list");

function formatBorrowDate(value) {
  if (!value) return "Not available";

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

async function getData(url) {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    window.location.replace("/pages/public/login.html");
    return null;
  }

  if (response.status === 403) {
    throw new Error("This page is available to Student accounts only.");
  }

  const result = await response.json();

  if (
    !response.ok ||
    result.success !== true ||
    !Array.isArray(result.data)
  ) {
    throw new Error(
      result.message || "The server returned an unexpected response."
    );
  }

  return result.data;
}

async function loadMyRequests() {
  requestsStatus.textContent = "Loading requests...";
  requestsList.replaceChildren();

  try {
    const requests = await getData("/api/borrows/requests/my");
    if (!requests) return null;

    const pendingLoanIds = new Set();

    const typeLabels = {
      borrow: "Borrow",
      return: "Return",
      renew: "Renewal",
    };

    const fragment = document.createDocumentFragment();

    for (const request of requests) {
      if (
        request.status === "pending" &&
        (request.request_type === "return" ||
          request.request_type === "renew")
      ) {
        pendingLoanIds.add(Number(request.borrow_id));
      }

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

      let statusText =
        {
          pending: "Pending",
          approved: "Approved",
          declined: "Declined",
        }[request.status] || request.status;

      if (
        request.status === "approved" &&
        request.request_type === "renew"
      ) {
        statusText = "Renewed";
      } else if (
        request.status === "approved" &&
        request.request_type === "return"
      ) {
        statusText = "Returned";
      }

      addBorrowDetail(details, "Status", statusText);

      if (
        request.request_type === "borrow" &&
        request.status === "pending" &&
        Number.isInteger(Number(request.queue_position)) &&
        Number(request.queue_position) > 0
      ) {
        addBorrowDetail(
          details,
          "Queue position",
          request.queue_position
        );
      }

      addBorrowDetail(
        details,
        "Submitted",
        formatBorrowDate(request.requested_on)
      );

      if (request.reviewed_on) {
        addBorrowDetail(
          details,
          "Reviewed",
          formatBorrowDate(request.reviewed_on)
        );
      }

      if (request.decision_reason) {
        addBorrowDetail(
          details,
          "Reason",
          request.decision_reason
        );
      }

      card.append(heading, details);
      fragment.appendChild(card);
    }

    requestsList.appendChild(fragment);

    requestsStatus.textContent = requests.length
      ? `${requests.length} ${requests.length === 1 ? "request" : "requests"
      }.`
      : "You have no borrowing requests yet.";

    return pendingLoanIds;
  } catch (error) {
    requestsStatus.textContent =
      error.message ||
      "Could not load your requests. Please refresh and try again.";
    return null;
  }
}

async function submitLoanRequest(
  borrow,
  type,
  buttons,
  message
) {
  const action = type === "return" ? "return" : "renew";

  const promptText =
    type === "return"
      ? `Request a return for "${borrow.title || "this book"
      }"? Only submit this after handing the physical book to the librarian.`
      : `Request a renewal for "${borrow.title || "this book"
      }"?`;

  if (!window.confirm(promptText)) return;

  for (const button of buttons) {
    button.disabled = true;
  }

  const button =
    type === "return" ? buttons[0] : buttons[1];

  button.textContent = "Submitting request...";
  message.textContent = "";

  try {
    const response = await fetch(
      `/api/borrows/${encodeURIComponent(
        borrow.borrow_id
      )}/${action}`,
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
        message.textContent =
          "Could not confirm the request. Refresh this page to check My requests before trying again.";
        button.textContent = "Check My requests";
        return;
      }

      message.textContent =
        result.message || "Could not submit the request.";

      for (const control of buttons) {
        control.disabled = false;
      }

      button.textContent =
        type === "return"
          ? "Request return"
          : "Request renewal";
      return;
    }

    message.textContent =
      result.message ||
      "Request pending librarian approval.";

    await refreshBorrowingPage();
  } catch (error) {
    message.textContent =
      "Could not confirm the request. Refresh this page to check My requests before trying again.";
    button.textContent = "Check My requests";
  }
}

async function loadMyBorrows(pendingLoanIds) {
  borrowsStatus.textContent =
    "Loading your borrowing history...";
  borrowsList.replaceChildren();

  try {
    const borrows = await getData("/api/borrows/my");
    if (!borrows) return;

    const fragment = document.createDocumentFragment();

    for (const borrow of borrows) {
      const card = document.createElement("article");
      card.className = "borrow-record";

      const heading = document.createElement("h3");
      const link = document.createElement("a");
      link.className = "book-title-link";
      link.href =
        `/pages/public/book-details.html?id=${encodeURIComponent(
          borrow.book_id
        )}`;
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
        borrow.return_date
          ? formatBorrowDate(borrow.return_date)
          : "Not returned"
      );

      addBorrowDetail(
        details,
        "Renewals",
        borrow.renew_count
      );

      addBorrowDetail(
        details,
        "Copy barcode",
        borrow.barcode
      );

      card.append(heading, details);
      const reviewButton = document.createElement("button");
      reviewButton.type = "button";
      reviewButton.className = "nav-logout borrow-review-button";
      reviewButton.textContent = "Give review";

      reviewButton.addEventListener("click", () => {
        window.location.assign(
          `/pages/public/book-details.html?id=${encodeURIComponent(
            borrow.book_id
          )}&review=1`
        );
      });

      card.appendChild(reviewButton);
      if (!borrow.return_date) {
        const message = document.createElement("p");
        message.setAttribute("role", "status");

        if (pendingLoanIds === null) {
          message.textContent =
            "Could not check pending requests. Refresh this page before submitting a return or renewal.";
        } else if (
          pendingLoanIds.has(Number(borrow.borrow_id))
        ) {
          message.textContent =
            "Return or renewal request pending librarian approval.";
        } else {
          const returnButton =
            document.createElement("button");
          returnButton.type = "button";
          returnButton.className = "auth-button";
          returnButton.textContent = "Request return";
          returnButton.style.marginTop = "20px";

          const renewButton =
            document.createElement("button");
          renewButton.type = "button";
          renewButton.className = "auth-button";
          renewButton.textContent = "Request renewal";
          renewButton.style.marginTop = "12px";

          const buttons = [returnButton, renewButton];

          returnButton.addEventListener("click", () => {
            submitLoanRequest(
              borrow,
              "return",
              buttons,
              message
            );
          });

          renewButton.addEventListener("click", () => {
            submitLoanRequest(
              borrow,
              "renew",
              buttons,
              message
            );
          });

          card.append(returnButton, renewButton);
        }

        card.appendChild(message);
      }

      fragment.appendChild(card);
    }

    borrowsList.appendChild(fragment);

    borrowsStatus.textContent = borrows.length
      ? `${borrows.length} borrowing ${borrows.length === 1 ? "record" : "records"
      }.`
      : "You have not borrowed any books yet.";
  } catch (error) {
    borrowsStatus.textContent =
      error.message ||
      "Could not load your borrowing history. Please refresh and try again.";
  }
}

async function refreshBorrowingPage() {
  const pendingLoanIds = await loadMyRequests();
  await loadMyBorrows(pendingLoanIds);
}

refreshBorrowingPage();
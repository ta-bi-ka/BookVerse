const bookStatus = document.getElementById("book-status");
const bookDetails = document.getElementById("book-details");
const detailsTitle = document.getElementById("details-title");

const borrowButton = document.getElementById("borrow-button");
const borrowStatus = document.getElementById("borrow-status");
const borrowLogin = document.getElementById("borrow-login");

const selectedBookId = Number(
  new URLSearchParams(window.location.search).get("id")
);

let submittingBorrowRequest = false;

function addDetail(list, label, value) {
  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent =
    value === null || value === undefined || value === ""
      ? "Not specified"
      : String(value);

  list.append(term, description);
}

async function loadBookDetails() {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("id");

  if (!bookId || !/^[1-9]\d*$/.test(bookId)) {
    bookStatus.textContent =
      "Please select a book from the Browse Books page.";
    return;
  }

  try {
    const response = await fetch(
      `/api/books/${encodeURIComponent(bookId)}`
    );
    const result = await response.json();

    if (response.status === 404) {
      bookStatus.textContent =
        "This book could not be found. Please return to Browse Books.";
      return;
    }

    if (
      !response.ok ||
      result.success !== true ||
      !result.data ||
      typeof result.data !== "object" ||
      Array.isArray(result.data)
    ) {
      throw new Error("Unexpected book details response");
    }

    const book = result.data;
    const title = book.title || "Untitled book";

    detailsTitle.textContent = title;
    document.title = `${title} — BookVerse`;

    const authors = Array.isArray(book.authors)
      ? book.authors
          .map((author) => author.author_name)
          .filter(Boolean)
      : [];

    const genres = Array.isArray(book.genres)
      ? book.genres
          .map((genre) => genre.genre_name)
          .filter(Boolean)
      : [];

    const description = document.createElement("p");
    description.className = "book-description";
    description.textContent =
      book.description ||
      "No description is available for this book.";

    const information = document.createElement("dl");
    information.className = "book-information";

    addDetail(information, "Authors", authors.join(", "));
    addDetail(information, "Genres", genres.join(", "));
    addDetail(
      information,
      "Publisher",
      book.publisher?.publisher_name
    );
    addDetail(information, "ISBN", book.isbn);
    addDetail(information, "Language", book.language);
    addDetail(information, "Edition", book.edition);
    addDetail(
      information,
      "Publication year",
      book.publication_year
    );
    addDetail(information, "Total pages", book.total_pages);

    bookDetails.replaceChildren(description, information);
    bookStatus.textContent = "";
  } catch (error) {
    bookStatus.textContent =
      "Could not load book details. Please check that the backend is running and refresh the page.";

    console.error("Loading book details failed:", error);
  }
}

async function prepareBorrowing() {
  borrowButton.hidden = true;
  borrowButton.disabled = true;

  if (
    !Number.isSafeInteger(selectedBookId) ||
    selectedBookId <= 0
  ) {
    borrowStatus.textContent =
      "Select a valid book from Browse Books first.";
    return;
  }

  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) {
      borrowStatus.textContent =
        "Please log in to request this book.";
      borrowLogin.hidden = false;
      return;
    }

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error("Session check failed");
    }

    if (result.data?.roleName !== "Student") {
      borrowStatus.textContent =
        "Borrow requests are available to Student accounts only.";
      return;
    }

    // Students can request a book even when no copy is available.
    borrowStatus.textContent =
      "Submit a borrow request to join this book's waiting list.";
    borrowButton.textContent = "Request to borrow";
    borrowButton.hidden = false;
    borrowButton.disabled = false;
  } catch (error) {
    borrowStatus.textContent =
      "Could not check your account. Please refresh the page.";
  }
}

borrowButton.addEventListener("click", async () => {
  if (submittingBorrowRequest || borrowButton.disabled) return;

  submittingBorrowRequest = true;
  borrowButton.disabled = true;
  borrowButton.textContent = "Submitting...";
  borrowStatus.textContent = "";

  let allowRetry = true;

  try {
    const response = await fetch("/api/borrows", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookId: selectedBookId }),
    });

    const result = await response.json();

    if (response.status === 401) {
      borrowStatus.textContent =
        "Your session has expired. Please log in again.";
      borrowLogin.hidden = false;
      borrowButton.hidden = true;
      allowRetry = false;
      return;
    }

    if (response.status === 403) {
      borrowStatus.textContent =
        "Your account is not permitted to request this book.";
      allowRetry = false;
      return;
    }

    if (!response.ok || result.success !== true) {
      if (response.status >= 500) {
        borrowStatus.textContent =
          "Could not confirm your request. Check My requests before trying again.";
        allowRetry = false;
      } else {
        borrowStatus.textContent =
          result.message || "Could not submit the borrow request.";
      }
      return;
    }

    borrowStatus.textContent =
      "Borrow request submitted. Pending librarian approval.";
    borrowButton.textContent = "Request pending";
    allowRetry = false;
  } catch (error) {
    borrowStatus.textContent =
      "Could not confirm your request. Check My requests before trying again.";
    allowRetry = false;
  } finally {
    submittingBorrowRequest = false;

    if (allowRetry) {
      borrowButton.disabled = false;
      borrowButton.textContent = "Request to borrow";
    } else if (borrowButton.textContent === "Submitting...") {
      borrowButton.textContent = "Check My requests";
    }
  }
});

loadBookDetails();
prepareBorrowing();
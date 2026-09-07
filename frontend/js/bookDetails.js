const bookStatus = document.getElementById("book-status");
const bookDetails = document.getElementById("book-details");
const detailsTitle = document.getElementById("details-title");

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
      ? book.authors.map((author) => author.author_name).filter(Boolean)
      : [];

    const genres = Array.isArray(book.genres)
      ? book.genres.map((genre) => genre.genre_name).filter(Boolean)
      : [];

    const description = document.createElement("p");
    description.className = "book-description";
    description.textContent =
      book.description || "No description is available for this book.";

    const information = document.createElement("dl");
    information.className = "book-information";

    addDetail(information, "Authors", authors.join(", "));
    addDetail(information, "Genres", genres.join(", "));
    addDetail(information, "Publisher", book.publisher?.publisher_name);
    addDetail(information, "ISBN", book.isbn);
    addDetail(information, "Language", book.language);
    addDetail(information, "Edition", book.edition);
    addDetail(information, "Publication year", book.publication_year);
    addDetail(information, "Total pages", book.total_pages);

    bookDetails.replaceChildren(description, information);
    bookStatus.textContent = "";
  } catch (error) {
    bookStatus.textContent =
      "Could not load book details. Please check that the backend is running and refresh the page.";

    console.error("Loading book details failed:", error);
  }
}

loadBookDetails();
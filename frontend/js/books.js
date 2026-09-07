const booksGrid = document.getElementById("books-grid");
const booksStatus = document.getElementById("books-status");
const searchForm = document.getElementById("book-search-form");
const searchInput = document.getElementById("book-search-input");
const clearSearch = document.getElementById("clear-search");

let latestRequest = 0;

function createBookCard(book) {
  const card = document.createElement("article");
  card.className = "book-card";

  const title = document.createElement("h3");
  title.textContent = book.title || "Untitled book";

  const authorNames = Array.isArray(book.authors)
    ? book.authors.map((author) => author.author_name).filter(Boolean)
    : [];

  const genreNames = Array.isArray(book.genres)
    ? book.genres.map((genre) => genre.genre_name).filter(Boolean)
    : [];

  const authors = document.createElement("p");
  authors.textContent =
    `Author: ${authorNames.join(", ") || "Not specified"}`;

  const genres = document.createElement("p");
  genres.textContent =
    `Genre: ${genreNames.join(", ") || "Not specified"}`;

  const language = document.createElement("p");
  language.textContent =
    `Language: ${book.language || "Not specified"}`;

  card.append(title, authors, genres, language);
  return card;
}

async function loadBooks(query = "") {
  const requestId = ++latestRequest;

  booksStatus.textContent = "Loading books...";
  booksGrid.replaceChildren();
  booksGrid.setAttribute("aria-busy", "true");

  const url = query
    ? `/api/books/search?${new URLSearchParams({ q: query })}`
    : "/api/books";

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (requestId !== latestRequest) {
      return;
    }

    if (
      !response.ok ||
      result.success !== true ||
      !Array.isArray(result.data)
    ) {
      throw new Error("Unexpected books API response");
    }

    const books = result.data;

    if (books.length === 0) {
      booksStatus.textContent = query
        ? `No books found for "${query}".`
        : "No books have been added yet.";
      return;
    }

    const cards = document.createDocumentFragment();

    books.forEach((book) => {
      cards.appendChild(createBookCard(book));
    });

    booksGrid.appendChild(cards);

    const countText =
      `${books.length} ${books.length === 1 ? "book" : "books"}`;

    booksStatus.textContent = query
      ? `${countText} found for "${query}".`
      : `${countText} in the collection.`;
  } catch (error) {
    if (requestId !== latestRequest) {
      return;
    }

    booksStatus.textContent =
      "Could not load books. Please check that the backend is running and try again.";

    console.error("Loading books failed:", error);
  } finally {
    if (requestId === latestRequest) {
      booksGrid.setAttribute("aria-busy", "false");
    }
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadBooks(searchInput.value.trim());
});

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  loadBooks();
  searchInput.focus();
});

loadBooks();
(() => {
  const status = document.getElementById("add-book-status");
  const form = document.getElementById("add-book-form");
  const saveButton = document.getElementById("save-book");

  const title = document.getElementById("book-title");
  const isbn = document.getElementById("book-isbn");
  const publisher = document.getElementById("book-publisher");
  const authors = document.getElementById("book-authors");
  const genres = document.getElementById("book-genres");

  const catalogueSection = document.getElementById(
    "catalogue-section"
  );
  const catalogueSearch = document.getElementById(
    "catalogue-search"
  );
  const catalogueCards = document.getElementById(
    "catalogue-cards"
  );

  let publisherRecords = [];
  let authorRecords = [];
  let genreRecords = [];
  let catalogueBooks = [];

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
    });

    if (response.status === 401) {
      window.location.assign("/pages/public/login.html");
      throw new Error("Please log in.");
    }

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("The server returned an unexpected response.");
    }

    if (!response.ok || result.success !== true) {
      throw new Error(
        result.message || `The request failed (${response.status}).`
      );
    }

    return result.data;
  }

  function normalizeName(value) {
    return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }

  function splitNames(value) {
    const names = new Map();

    for (const part of value.split(",")) {
      const name = part.trim().replace(/\s+/g, " ");

      if (name) {
        names.set(normalizeName(name), name);
      }
    }

    return [...names.values()];
  }

  function fillSuggestions(datalistId, records, nameKey) {
    const datalist = document.getElementById(datalistId);
    datalist.replaceChildren();

    for (const record of records) {
      const option = document.createElement("option");
      option.value = record[nameKey];
      datalist.appendChild(option);
    }
  }

  function refreshSuggestions() {
    fillSuggestions(
      "publisher-suggestions",
      publisherRecords,
      "publisher_name"
    );
    fillSuggestions(
      "author-suggestions",
      authorRecords,
      "author_name"
    );
    fillSuggestions(
      "genre-suggestions",
      genreRecords,
      "genre_name"
    );
  }

  async function loadNames() {
    [
      publisherRecords,
      authorRecords,
      genreRecords,
    ] = await Promise.all([
      api("/api/publishers"),
      api("/api/authors"),
      api("/api/genres"),
    ]);

    if (
      !Array.isArray(publisherRecords) ||
      !Array.isArray(authorRecords) ||
      !Array.isArray(genreRecords)
    ) {
      throw new Error("Could not load publisher, author, or genre names.");
    }

    refreshSuggestions();
  }

  async function findOrCreate(
    name,
    records,
    nameKey,
    idKey,
    endpoint,
    requestKey
  ) {
    const existing = records.find(
      (record) =>
        normalizeName(record[nameKey]) === normalizeName(name)
    );

    if (existing) {
      return Number(existing[idKey]);
    }

    try {
      const created = await api(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [requestKey]: name,
        }),
      });

      records.push(created);
      refreshSuggestions();

      return Number(created[idKey]);
    } catch (error) {
      /*
       * If someone else created the same name just before this request,
       * reload the list and use their entry. Otherwise show the error.
       */
      const latestRecords = await api(endpoint);

      if (!Array.isArray(latestRecords)) {
        throw error;
      }

      records.splice(0, records.length, ...latestRecords);
      refreshSuggestions();

      const match = records.find(
        (record) =>
          normalizeName(record[nameKey]) === normalizeName(name)
      );

      if (match) {
        return Number(match[idKey]);
      }

      throw error;
    }
  }

  function renderBooks() {
  catalogueCards.replaceChildren();

  const term = catalogueSearch.value.trim().toLowerCase();

  const matchingBooks = catalogueBooks.filter(
    (book) =>
      String(book.title || "").toLowerCase().includes(term) ||
      String(book.isbn || "").toLowerCase().includes(term)
  );

  for (const book of matchingBooks) {
    const card = document.createElement("article");
    card.className = "book-card";

    const heading = document.createElement("h3");
    heading.textContent = book.title || "Untitled book";

    const isbnText = document.createElement("p");
    isbnText.textContent = `ISBN: ${book.isbn || "Not listed"}`;

    const publisherText = document.createElement("p");
    publisherText.textContent =
      `Publisher: ${book.publisher?.publisher_name || "Not listed"}`;

    const copiesText = document.createElement("p");
    copiesText.textContent =
      `Available copies: ${book.available_copies ?? 0}`;

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "nav-logout";
    viewButton.textContent = "View book";

    viewButton.addEventListener("click", () => {
      window.location.assign(
        `/pages/public/book-details.html?id=${encodeURIComponent(
          book.book_id
        )}`
      );
    });

    card.append(
      heading,
      isbnText,
      publisherText,
      copiesText,
      viewButton
    );

    catalogueCards.appendChild(card);
  }

  if (matchingBooks.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No matching books.";
    catalogueCards.appendChild(empty);
  }
}

  async function loadBooks() {
    const books = await api("/api/books");

    if (!Array.isArray(books)) {
      throw new Error("Could not load books.");
    }

    catalogueBooks = books;
    catalogueSection.hidden = false;
    renderBooks();
  }

  async function start() {
    try {
      const session = await api("/api/auth/session");

      if (session.roleName !== "Librarian") {
        status.textContent =
          "This page is available to Librarians only.";
        return;
      }

      status.textContent = "Loading book information...";

      await Promise.all([
        loadNames(),
        loadBooks(),
      ]);

      form.hidden = false;
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (saveButton.disabled) {
      return;
    }

    saveButton.disabled = true;
    status.textContent = "Adding book...";

    const publisherName = publisher.value
      .trim()
      .replace(/\s+/g, " ");

    const authorNames = splitNames(authors.value);
    const genreNames = splitNames(genres.value);

    const year = document.getElementById("book-year").value;
    const pages = document.getElementById("book-pages").value;

    try {
      if (!publisherName) {
        throw new Error("Enter a publisher.");
      }

      if (publisherName.length > 100) {
        throw new Error(
          "Publisher name cannot exceed 100 characters."
        );
      }

      if (authorNames.some((name) => name.length > 100)) {
        throw new Error(
          "Each author name must be at most 100 characters."
        );
      }

      if (genreNames.some((name) => name.length > 50)) {
        throw new Error(
          "Each genre name must be at most 50 characters."
        );
      }

      const publisherId = await findOrCreate(
        publisherName,
        publisherRecords,
        "publisher_name",
        "publisher_id",
        "/api/publishers",
        "publisherName"
      );

      const authorIds = [];

      for (const name of authorNames) {
        authorIds.push(
          await findOrCreate(
            name,
            authorRecords,
            "author_name",
            "author_id",
            "/api/authors",
            "authorName"
          )
        );
      }

      const genreIds = [];

      for (const name of genreNames) {
        genreIds.push(
          await findOrCreate(
            name,
            genreRecords,
            "genre_name",
            "genre_id",
            "/api/genres",
            "genreName"
          )
        );
      }

      await api("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.value.trim(),
          isbn: isbn.value.trim(),
          publisherId,
          authorIds,
          genreIds,
          description:
            document
              .getElementById("book-description")
              .value.trim() || null,
          language:
            document
              .getElementById("book-language")
              .value.trim() || null,
          publicationYear: year ? Number(year) : null,
          totalPages: pages ? Number(pages) : null,
        }),
      });

      form.reset();

      status.textContent =
        "Book added. Go to Manage Books → Add new book copy " +
        "to add a physical copy.";

      try {
        await loadBooks();
      } catch {
        status.textContent +=
          " Refresh the page to update the book cards.";
      }
    } catch (error) {
      status.textContent = error.message;
    } finally {
      saveButton.disabled = false;
    }
  });

  catalogueSearch.addEventListener("input", renderBooks);

  start();
})();
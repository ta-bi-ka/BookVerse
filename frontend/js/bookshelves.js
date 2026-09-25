(() => {
  const status = document.getElementById("shelves-status");
  const controls = document.getElementById("shelf-controls");
  const select = document.getElementById("shelf-select");
  const nameInput = document.getElementById("shelf-name");
  const renameForm = document.getElementById("rename-shelf-form");
  const books = document.getElementById("shelf-books");
  const count = document.getElementById("shelf-book-count");
  const refresh = document.getElementById("refresh-shelves");

  let busy = false;

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
    });

    if (response.status === 401) {
      throw new Error("Please log in to view your bookshelves.");
    }

    if (response.status === 403) {
      throw new Error(
        "Only Students can manage their own bookshelves."
      );
    }

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(
        response.status >= 500
          ? "The server could not complete this action. Refresh before retrying."
          : result.message || "The action failed."
      );
    }

    return result.data;
  }

  function setBusy(value) {
    busy = value;
    refresh.disabled = value;

    controls.querySelectorAll("button, input, select").forEach(
      (element) => {
        element.disabled = value;
      }
    );
  }

  function updateCount() {
    const total = books.children.length;

    count.textContent = total
      ? `${total} ${total === 1 ? "book" : "books"} on this bookshelf.`
      : "This bookshelf is empty. Add books from Browse Books.";
  }

  async function displaySelectedShelf() {
    books.replaceChildren();
    count.textContent = "";

    nameInput.value = select.selectedOptions[0]?.textContent || "";

    const items = await api(
      `/api/bookshelves/${encodeURIComponent(select.value)}/books`
    );

    if (!Array.isArray(items)) {
      throw new Error("Unexpected bookshelf response.");
    }

    items.forEach((book) => {
      const card = document.createElement("article");
      card.className = "book-card";

      const heading = document.createElement("h3");
      const link = document.createElement("a");
      link.className = "book-title-link";
      link.href =
        `/pages/public/book-details.html?id=${encodeURIComponent(book.book_id)}`;
      link.textContent = book.title || "Untitled book";
      heading.appendChild(link);

      const isbn = document.createElement("p");
      isbn.textContent = `ISBN: ${book.isbn || "Not provided"}`;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "nav-logout";
      remove.textContent = "Remove from bookshelf";
      remove.style.marginTop = "16px";

      const shelfId = select.value;

      remove.addEventListener("click", async () => {
        if (busy) return;

        if (!window.confirm(
          `Remove "${book.title}" from this bookshelf?`
        )) {
          return;
        }

        setBusy(true);
        status.textContent = "Removing book...";

        try {
          await api(
            `/api/bookshelves/${encodeURIComponent(shelfId)}/books/${encodeURIComponent(book.book_id)}`,
            { method: "DELETE" }
          );

          card.remove();
          updateCount();
          status.textContent = "Book removed from this bookshelf.";
        } catch (error) {
          status.textContent = error.message;
        } finally {
          setBusy(false);
        }
      });

      card.append(heading, isbn, remove);
      books.appendChild(card);
    });

    updateCount();
  }

  async function loadShelves() {
    if (busy) return;

    const previousId = select.value;

    setBusy(true);
    controls.hidden = true;
    select.replaceChildren();
    books.replaceChildren();
    count.textContent = "";
    status.textContent = "Loading bookshelves...";

    try {
      const shelves = await api("/api/bookshelves/my");

      if (!Array.isArray(shelves)) {
        throw new Error("Unexpected bookshelf response.");
      }

      if (!shelves.length) {
        status.textContent =
          'You have no bookshelves yet. Open Browse Books and select "Add to bookshelf" to create one.';
        return;
      }

      shelves.forEach((shelf) => {
        const option = document.createElement("option");
        option.value = shelf.shelf_id;
        option.textContent = shelf.shelf_name;
        select.appendChild(option);
      });

      if (shelves.some(
        (shelf) => String(shelf.shelf_id) === previousId
      )) {
        select.value = previousId;
      }

      controls.hidden = false;
      await displaySelectedShelf();
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  }

  select.addEventListener("change", async () => {
    if (busy) return;

    setBusy(true);
    status.textContent = "Loading books...";

    try {
      await displaySelectedShelf();
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  });

  renameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !select.value) return;

    const shelfName = nameInput.value.trim();

    if (!shelfName) {
      status.textContent = "Please enter a bookshelf name.";
      return;
    }

    setBusy(true);
    status.textContent = "Saving name...";

    try {
      const shelf = await api(
        `/api/bookshelves/${encodeURIComponent(select.value)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shelfName }),
        }
      );

      select.selectedOptions[0].textContent = shelf.shelf_name;
      nameInput.value = shelf.shelf_name;
      status.textContent = "Bookshelf renamed successfully.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  });

  refresh.addEventListener("click", loadShelves);
  loadShelves();
})();
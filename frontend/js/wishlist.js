(() => {
  const dialog = document.getElementById("wishlist-dialog");
  const bookTitle = document.getElementById("wishlist-book-title");
  const shelfSelect = document.getElementById("wishlist-shelf");
  const addButton = document.getElementById("wishlist-add");
  const createForm = document.getElementById("wishlist-create-form");
  const nameInput = document.getElementById("wishlist-name");
  const status = document.getElementById("wishlist-status");
  const closeButton = document.getElementById("wishlist-close");

  let selectedBook = null;
  let busy = false;

  const studentSession = fetch("/api/auth/session", {
    credentials: "same-origin",
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) return false;
      const result = await response.json();

      return result.success === true &&
        result.data?.roleName === "Student";
    })
    .catch(() => false);

  async function api(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
    });

    if (response.status === 401) {
      throw new Error("Please log in again to manage your bookshelves.");
    }

    if (response.status === 403) {
      throw new Error("Only Students can manage their own bookshelves.");
    }

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(
        response.status >= 500
          ? "The server could not complete this action. Close and reopen the bookshelf selector before retrying."
          : result.message || "The action failed."
      );
    }

    return result.data;
  }

  function setBusy(value) {
    busy = value;

    dialog.querySelectorAll("button, input, select").forEach((element) => {
      element.disabled = value;
    });

    addButton.disabled = value || !shelfSelect.value;
  }

  function addShelfOption(shelf) {
    const option = document.createElement("option");
    option.value = shelf.shelf_id;
    option.textContent = shelf.shelf_name;
    shelfSelect.appendChild(option);
  }

  async function openWishlist(book) {
    if (dialog.open || busy) return;

    selectedBook = book;
    bookTitle.textContent = book.title || "Selected book";
    shelfSelect.replaceChildren();
    createForm.reset();
    status.textContent = "Loading your bookshelves...";

    dialog.showModal();
    setBusy(true);

    try {
      const shelves = await api("/api/bookshelves/my");

      if (!Array.isArray(shelves)) {
        throw new Error("Unexpected bookshelf response.");
      }

      shelves.forEach(addShelfOption);

      status.textContent = shelves.length
        ? "Choose a bookshelf, then add this book."
        : "Create your first bookshelf below.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  }

  createForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;

    const shelfName = nameInput.value.trim();

    if (!shelfName) {
      status.textContent = "Please enter a bookshelf name.";
      return;
    }

    setBusy(true);
    status.textContent = "Creating bookshelf...";

    try {
      const shelf = await api("/api/bookshelves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shelfName,
          visibility: "private",
        }),
      });

      addShelfOption(shelf);
      shelfSelect.value = String(shelf.shelf_id);
      createForm.reset();

      status.textContent =
        "Bookshelf created. Click Add to selected bookshelf to save the book.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  });

  addButton.addEventListener("click", async () => {
    if (busy || !selectedBook || !shelfSelect.value) return;

    setBusy(true);
    status.textContent = "Adding book...";

    try {
      await api(
        `/api/bookshelves/${encodeURIComponent(shelfSelect.value)}/books`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: selectedBook.book_id }),
        }
      );

      status.textContent = "Book added to your bookshelf.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
    }
  });

  closeButton.addEventListener("click", () => dialog.close());

  dialog.addEventListener("cancel", (event) => {
    if (busy) event.preventDefault();
  });

  shelfSelect.addEventListener("change", () => {
    addButton.disabled = busy || !shelfSelect.value;
  });

  window.addWishlistButton = async (card, book) => {
    if (!(await studentSession)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-logout";
    button.textContent = "Add to bookshelf";
    button.style.marginTop = "16px";

    button.addEventListener("click", () => openWishlist(book));
    card.appendChild(button);
  };
})();
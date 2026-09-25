(async () => {
  const status = document.getElementById(
    "manage-books-status"
  );
  const options = document.getElementById(
    "manage-books-options"
  );

  try {
    const response = await fetch(
      "/api/auth/session",
      {
        credentials: "same-origin",
        cache: "no-store",
      }
    );

    if (response.status === 401) {
      window.location.replace(
        "/pages/public/login.html"
      );
      return;
    }

    const result = await response.json();

    if (
      !response.ok ||
      result.success !== true
    ) {
      throw new Error(
        "Could not verify your account."
      );
    }

    if (
      result.data?.roleName !== "Librarian"
    ) {
      status.textContent =
        "This page is available to Librarians only.";
      return;
    }

    options.hidden = false;
    status.textContent = "";
  } catch (error) {
    status.textContent =
      error.message ||
      "Could not load Manage Books.";
  }
})();
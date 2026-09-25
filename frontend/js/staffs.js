(() => {
  const status = document.getElementById("directory-status");
  const librariansSection = document.getElementById(
    "librarians-section"
  );
  const librariansList = document.getElementById(
    "librarians-list"
  );
  const studentsSection = document.getElementById(
    "students-section"
  );
  const studentsList = document.getElementById(
    "students-list"
  );

  function renderUsers(container, users) {
    container.replaceChildren();

    if (users.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No accounts in this list.";
      container.appendChild(empty);
      return;
    }

    for (const user of users) {
      const card = document.createElement("article");
      card.className = "book-card";

      const name = document.createElement("h3");
      name.textContent = user.full_name;

      const username = document.createElement("p");
      username.textContent = `Username: ${user.username}`;

      const accountStatus = document.createElement("p");
      accountStatus.textContent =
        `Account: ${user.is_active ? "Active" : "Inactive"}`;

      card.append(name, username, accountStatus);
      container.appendChild(card);
    }
  }

  async function loadDirectory() {
    try {
      const response = await fetch("/api/staff-directory", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Could not load the directory."
        );
      }

      const directory = result.data;

      if (!directory || !Array.isArray(directory.students)) {
        throw new Error("Unexpected directory response.");
      }

      renderUsers(studentsList, directory.students);
      studentsSection.hidden = false;

      if (directory.viewerRole === "Admin") {
        if (!Array.isArray(directory.librarians)) {
          throw new Error("Unexpected librarian list.");
        }

        renderUsers(librariansList, directory.librarians);
        librariansSection.hidden = false;
      }

      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
    }
  }

  loadDirectory();
})();
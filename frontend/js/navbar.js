async function updateAuthNavigation() {
  const navigation = document.querySelector(".nav-links");
  if (!navigation) return;

  const loginPath = "/pages/public/login.html";

  function addLink(label, path) {
    const item = document.createElement("li");
    const link = document.createElement("a");

    link.href = path;
    link.textContent = label;

    if (window.location.pathname === path) {
      link.setAttribute("aria-current", "page");
    }

    item.appendChild(link);
    navigation.appendChild(item);
  }

  function showGuestNavigation() {
    navigation.replaceChildren();

    addLink("Home", "/pages/public/index.html");
    addLink("Browse Books", "/pages/public/books.html");
    addLink("Login", loginPath);
    addLink("Register", "/pages/public/register.html");
  }

  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) {
      showGuestNavigation();
      return;
    }

    const result = await response.json();

    if (!response.ok || result.success !== true || !result.data) {
      throw new Error("Session check failed");
    }

    const role = result.data.roleName;

    navigation.replaceChildren();

    addLink("Home", "/pages/public/index.html");
    addLink("Browse Books", "/pages/public/books.html");
    addLink("My Profile", "/pages/user/account.html");

    if (role === "Admin") {
      addLink(
        "Librarian Applications",
        "/pages/admin/librarian-applications.html"
      );
    }

    if (role === "Librarian") {
      addLink(
        "Borrowing Requests",
        "/pages/librarian/requests.html"
      );
      addLink(
        "Manage Books",
        "/pages/librarian/manage-books.html"
      );
    }

    if (role === "Admin" || role === "Librarian") {
      addLink("Staffs", "/pages/librarian/staffs.html");
    }

    const logoutItem = document.createElement("li");
    logoutItem.className = "nav-logout-item";

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "nav-logout";
    logoutButton.textContent = "Logout";

    logoutButton.addEventListener("click", async () => {
      if (logoutButton.disabled) return;

      logoutButton.disabled = true;
      logoutButton.textContent = "Logging out...";

      try {
        const logoutResponse = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });

        const logoutResult = await logoutResponse.json();

        if (
          !logoutResponse.ok ||
          logoutResult.success !== true
        ) {
          throw new Error("Logout failed");
        }

        window.location.assign(loginPath);
      } catch (error) {
        logoutButton.disabled = false;
        logoutButton.textContent = "Logout";
        window.alert("Could not log out. Please try again.");
      }
    });

    logoutItem.appendChild(logoutButton);
    navigation.appendChild(logoutItem);
  } catch (error) {
    console.error("Could not update navigation:", error);
  }
}

updateAuthNavigation();
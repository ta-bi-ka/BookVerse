async function updateAuthNavigation() {
  const navigation = document.querySelector(".nav-links");

  if (!navigation) return;

  const profilePath = "/pages/user/account.html";
  const loginPath = "/pages/public/login.html";

  // Reuse an existing profile link when the page already has one.
  let profileLink = navigation.querySelector(
    `a[href="${profilePath}"]`
  );

  if (profileLink) {
    profileLink.closest("li").hidden = true;
  }

  const registerItem = Array.from(
    navigation.querySelectorAll("li")
  ).find((item) => item.textContent.trim() === "Register");

  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) return;

    const result = await response.json();

    if (!response.ok || result.success !== true) return;
    if (result.data.roleName === "Admin") {
      const applicationsPath = "/pages/admin/librarian-applications.html";

      if (!navigation.querySelector(`a[href="${applicationsPath}"]`)) {
        const item = document.createElement("li");
        const link = document.createElement("a");

        link.href = applicationsPath;
        link.textContent = "Librarian Applications";

        if (window.location.pathname === applicationsPath) {
          link.setAttribute("aria-current", "page");
        }

        item.appendChild(link);
        const loginItem = navigation
          .querySelector('a[href="/pages/public/login.html"]')
          ?.closest("li");

        const logoutItem = navigation
          .querySelector(".nav-logout")
          ?.closest("li");

        navigation.insertBefore(item, logoutItem || loginItem || null);
      }
    }

    const loginLink = navigation.querySelector(
      `a[href="${loginPath}"]`
    );

    // Add My Profile if it is missing on this page.
    if (!profileLink) {
      const profileItem = document.createElement("li");

      profileLink = document.createElement("a");
      profileLink.href = profilePath;
      profileLink.textContent = "My Profile";
      profileItem.appendChild(profileLink);

      const loginItem = loginLink?.closest("li");
      navigation.insertBefore(profileItem, loginItem || null);
    }

    profileLink.closest("li").hidden = false;

    if (window.location.pathname === profilePath) {
      profileLink.setAttribute("aria-current", "page");
    } else {
      profileLink.removeAttribute("aria-current");
    }

    if (registerItem) {
      registerItem.hidden = true;
    }
    if (result.data.roleName === "Librarian") {
  const requestsPath = "/pages/librarian/requests.html";

  if (!navigation.querySelector(`a[href="${requestsPath}"]`)) {
    const item = document.createElement("li");
    const link = document.createElement("a");

    link.href = requestsPath;
    link.textContent = "Borrowing Requests";

    if (window.location.pathname === requestsPath) {
      link.setAttribute("aria-current", "page");
    }

    item.appendChild(link);

    const logoutItem = navigation
      .querySelector(".nav-logout")
      ?.closest("li");

    navigation.insertBefore(
      item,
      logoutItem || loginLink?.closest("li") || null
    );
  }
}
    if (!loginLink) return;

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "nav-logout";
    logoutButton.textContent = "Logout";

    loginLink.replaceWith(logoutButton);

    logoutButton.addEventListener("click", async () => {
      if (logoutButton.disabled) return;

      logoutButton.disabled = true;
      logoutButton.textContent = "Logging out...";

      try {
        const logoutResponse = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });

        if (logoutResponse.status !== 401) {
          const logoutResult = await logoutResponse.json();

          if (!logoutResponse.ok || logoutResult.success !== true) {
            throw new Error("Logout failed");
          }
        }

        window.location.assign(loginPath);
      } catch (error) {
        logoutButton.disabled = false;
        logoutButton.textContent = "Logout";
        window.alert("Could not log out. Please try again.");
      }
    });
  } catch (error) {
    console.error("Could not check login status.");
  }
}

updateAuthNavigation();
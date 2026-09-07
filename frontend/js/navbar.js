async function updateAuthNavigation() {
  const loginLink = document.querySelector(
    '.nav-links a[href="/pages/public/login.html"]'
  );

  if (!loginLink) return;

  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) return;

    const result = await response.json();

    if (!response.ok || result.success !== true) return;

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "nav-logout";
    logoutButton.textContent = "Logout";

    loginLink.replaceWith(logoutButton);
    // Hide Register for signed-in users.
const registerItem = Array.from(
  document.querySelectorAll(".nav-links li")
).find((item) => item.textContent.trim() === "Register");

if (registerItem) {
  registerItem.hidden = true;
}

    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "Logging out...";

      try {
        const logoutResponse = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });

        // An expired session means the user is already signed out.
        if (logoutResponse.status !== 401) {
          const logoutResult = await logoutResponse.json();

          if (!logoutResponse.ok || logoutResult.success !== true) {
            throw new Error("Logout failed");
          }
        }

        window.location.assign("/pages/public/login.html");
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
const loginForm = document.getElementById("login-form");
const identifierInput = document.getElementById("login-identifier");
const passwordInput = document.getElementById("login-password");
const loginButton = document.getElementById("login-button");
const loginStatus = document.getElementById("login-status");

let submitting = false;

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (submitting) {
    return;
  }

  const identifier = identifierInput.value.trim();
  const password = passwordInput.value;

  if (!identifier || !password.trim()) {
    loginStatus.textContent = "Please enter your username/email and password.";
    return;
  }

  submitting = true;
  loginButton.disabled = true;
  loginButton.textContent = "Logging in...";
  loginStatus.textContent = "";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    });

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      loginStatus.textContent =
        response.status >= 500
          ? "Login is temporarily unavailable. Please try again."
          : result.message || "Login failed. Please check your details.";
      return;
    }

    passwordInput.value = "";
    window.location.assign("/pages/public/books.html");
  } catch (error) {
    loginStatus.textContent =
      "Could not complete login. Check that the backend is running and try again.";
  } finally {
    submitting = false;
    loginButton.disabled = false;
    loginButton.textContent = "Log in";
  }
});

loginButton.disabled = false;
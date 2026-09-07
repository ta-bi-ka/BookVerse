const registerForm = document.getElementById("register-form");
const registerButton = document.getElementById("register-button");
const registerStatus = document.getElementById("register-status");

const nameInput = document.getElementById("register-name");
const usernameInput = document.getElementById("register-username");
const emailInput = document.getElementById("register-email");
const phoneInput = document.getElementById("register-phone");
const passwordInput = document.getElementById("register-password");
const confirmInput = document.getElementById("register-confirm-password");

let registering = false;

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (registering) return;

  const fullName = nameInput.value.trim();
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  if (!fullName || !username || !email || !password.trim()) {
    registerStatus.textContent = "Please complete all required fields.";
    return;
  }

  if (password !== confirmInput.value) {
    registerStatus.textContent = "The passwords do not match.";
    confirmInput.focus();
    return;
  }

  registering = true;
  registerButton.disabled = true;
  registerButton.textContent = "Creating account...";
  registerStatus.textContent = "";

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        username,
        email,
        phone,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      registerStatus.textContent =
        response.status >= 500
          ? "Registration is temporarily unavailable. Please try again."
          : result.message || "Could not create your account.";
      return;
    }

    registerForm.reset();
    registerStatus.textContent =
      "Account created successfully. Use the Log in link below to sign in.";
  } catch (error) {
    registerStatus.textContent =
      "Could not confirm registration. Check your connection. If you retry and the account already exists, try logging in.";
  } finally {
    registering = false;
    registerButton.disabled = false;
    registerButton.textContent = "Create account";
  }
});

registerStatus.textContent = "";
registerButton.disabled = false;
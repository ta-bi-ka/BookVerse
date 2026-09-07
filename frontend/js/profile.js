const profileStatus = document.getElementById("profile-status");
const profileDetails = document.getElementById("profile-details");
const profileForm = document.getElementById("profile-form");
const profileSave = document.getElementById("profile-save");
const saveStatus = document.getElementById("profile-save-status");

const profileName = document.getElementById("profile-name");
const profileUsername = document.getElementById("profile-username");
const profileEmail = document.getElementById("profile-email");
const profilePhone = document.getElementById("profile-phone");

let savingProfile = false;
let profileLoaded = false;

function addProfileField(list, label, value) {
  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent =
    value === null || value === undefined || value === ""
      ? "Not provided"
      : String(value);

  list.append(term, description);
}

function formatProfileDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayProfile(profile) {
  const information = document.createElement("dl");
  information.className = "book-information";

  addProfileField(information, "Full name", profile.full_name);
  addProfileField(information, "Username", profile.username);
  addProfileField(information, "Email", profile.email);
  addProfileField(information, "Phone", profile.phone);
  addProfileField(information, "Role", profile.role_name);
  addProfileField(
    information,
    "Account status",
    profile.is_active ? "Active" : "Inactive"
  );
  addProfileField(
    information,
    "Member since",
    formatProfileDate(profile.created_on)
  );

  profileDetails.replaceChildren(information);
  profileStatus.textContent = "";

  profileName.value = profile.full_name || "";
  profileUsername.value = profile.username || "";
  profileEmail.value = profile.email || "";
  profilePhone.value = profile.phone || "";
}

function isProfileResponse(result) {
  return (
    result.success === true &&
    result.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
  );
}

async function loadProfile() {
  profileStatus.textContent = "Loading your profile...";
  profileSave.disabled = true;

  try {
    const response = await fetch("/api/profile", {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) {
      window.location.replace("/pages/public/login.html");
      return;
    }

    if (response.status === 404) {
      profileStatus.textContent = "Your profile could not be found.";
      return;
    }

    const result = await response.json();

    if (!response.ok || !isProfileResponse(result)) {
      throw new Error("Unexpected profile response");
    }

    displayProfile(result.data);
    profileLoaded = true;
    profileSave.disabled = false;
  } catch (error) {
    profileStatus.textContent =
      "Could not load your profile. Please refresh and try again.";
  }
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (savingProfile || !profileLoaded) return;

  const fullName = profileName.value.trim();
  const username = profileUsername.value.trim();
  const email = profileEmail.value.trim();
  const phone = profilePhone.value.trim();

  if (!fullName || !username || !email) {
    saveStatus.textContent =
      "Full name, username, and email are required.";
    return;
  }

  savingProfile = true;
  profileSave.disabled = true;
  profileSave.textContent = "Saving...";
  saveStatus.textContent = "";

  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        username,
        email,
        phone: phone || null,
      }),
    });

    if (response.status === 401) {
      profileLoaded = false;
      window.location.replace("/pages/public/login.html");
      return;
    }

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      saveStatus.textContent =
        response.status >= 500
          ? "Could not confirm the update. Refresh to check your saved profile."
          : result.message || "Could not update your profile.";
      return;
    }

    if (!isProfileResponse(result)) {
      throw new Error("Unexpected updated profile response");
    }

    displayProfile(result.data);
saveStatus.textContent = "";
profileStatus.textContent = "Profile updated successfully.";

editProfileSection.hidden = true;
editProfileToggle.setAttribute("aria-expanded", "false");
editProfileToggle.textContent = "Edit profile";
editProfileToggle.focus();
  } catch (error) {
    saveStatus.textContent =
      "Could not confirm the update. Refresh to check your saved profile.";
  } finally {
    savingProfile = false;
    profileSave.disabled = !profileLoaded;
    profileSave.textContent = "Save changes";
  }
});

loadProfile();
const editProfileToggle = document.getElementById("edit-profile-toggle");
const editProfileSection = document.getElementById("edit-profile-section");

editProfileToggle.addEventListener("click", () => {
  const opening = editProfileSection.hidden;

  editProfileSection.hidden = !opening;
  editProfileToggle.setAttribute("aria-expanded", String(opening));
  editProfileToggle.textContent = opening ? "Hide editor" : "Edit profile";

  if (opening) {
    profileName.focus();
  }
});
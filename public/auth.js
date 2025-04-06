// Initialize theme from localStorage or default to light
const currentTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", currentTheme);

// Handle theme toggle
document.addEventListener("DOMContentLoaded", function () {
  // Set up theme toggle button
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  if (themeToggleBtn) {
    updateThemeToggleButton(currentTheme);

    themeToggleBtn.addEventListener("click", function () {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";

      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);

      updateThemeToggleButton(newTheme);
    });
  }

  // Handle login form submission
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Handle registration form submission
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  // Handle logout button
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }

  // Handle update profile form
  const updateProfileForm = document.getElementById("update-profile-form");
  if (updateProfileForm) {
    updateProfileForm.addEventListener("submit", handleUpdateProfile);
  }

  // Handle change password form
  const changePasswordForm = document.getElementById("change-password-form");
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", handleChangePassword);
  }

  // Check if we're on the profile page and load user data
  if (window.location.pathname === "/profile.html") {
    loadUserProfile();
    loadReadingList();
  }

  // Check if user is logged in and update UI accordingly
  checkAuthStatus();
});

// Update theme toggle button text and icon
function updateThemeToggleButton(theme) {
  const button = document.getElementById("theme-toggle-btn");
  if (!button) return;

  const iconElement = button.querySelector("i");
  const textElement = button.querySelector("span");

  if (theme === "dark") {
    iconElement.className = "fas fa-sun";
    textElement.textContent = "Light Mode";
  } else {
    iconElement.className = "fas fa-moon";
    textElement.textContent = "Dark Mode";
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("login-error");

  try {
    // Reset error message
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");

    // Send login request
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!data.success) {
      // Show error message
      errorMessage.textContent = data.message || "Login failed";
      errorMessage.classList.remove("hidden");
      return;
    }

    // Redirect to home page on successful login
    window.location.href = "/profile.html";
  } catch (error) {
    console.error("Login error:", error);
    errorMessage.textContent =
      "An error occurred during login. Please try again.";
    errorMessage.classList.remove("hidden");
  }
}

// Handle registration form submission
async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("register-error");

  try {
    // Reset error message
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");

    // Send registration request
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!data.success) {
      // Show error message
      errorMessage.textContent = data.message || "Registration failed";
      errorMessage.classList.remove("hidden");
      return;
    }

    // Redirect to login page on successful registration
    window.location.href = "/login.html?registered=true";
  } catch (error) {
    console.error("Registration error:", error);
    errorMessage.textContent =
      "An error occurred during registration. Please try again.";
    errorMessage.classList.remove("hidden");
  }
}

// Handle logout button click
async function handleLogout() {
  try {
    // Send logout request
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    // Redirect to home page
    window.location.href = "/";
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Load user profile data
async function loadUserProfile() {
  const profileDataElement = document.getElementById("profile-data");
  if (!profileDataElement) return;

  try {
    // Show loading spinner
    profileDataElement.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i> Loading profile...
      </div>
    `;

    // Send request to get profile data
    const response = await fetch("/api/auth/profile", {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      // Redirect to login if not authenticated
      window.location.href = "/login.html?unauthorized=true";
      return;
    }

    const data = await response.json();

    if (!data.success) {
      profileDataElement.innerHTML = `<div class="error-message">Failed to load profile: ${data.message}</div>`;
      return;
    }

    // Update profile form with user data
    document.getElementById("name").value = data.user.name || "";
    document.getElementById("email").value = data.user.email || "";

    // Format dates
    const createdDate = new Date(data.user.createdAt).toLocaleDateString();
    const createdTime = new Date(data.user.createdAt).toLocaleTimeString();
    const lastLoginDate = data.user.lastLogin
      ? new Date(data.user.lastLogin).toLocaleDateString()
      : "N/A";
    const lastLoginTime = data.user.lastLogin
      ? new Date(data.user.lastLogin).toLocaleTimeString()
      : "";

    // Display profile data
    profileDataElement.innerHTML = `
      <div class="profile-data-item">
        <div class="profile-data-label">Name</div>
        <div class="profile-data-value">${data.user.name || "Not set"}</div>
      </div>
      <div class="profile-data-item">
        <div class="profile-data-label">Email</div>
        <div class="profile-data-value">${data.user.email}</div>
      </div>
      <div class="profile-data-item">
        <div class="profile-data-label">Account Created</div>
        <div class="profile-data-value">
          ${createdDate}
          <span class="text-muted">${createdTime}</span>
        </div>
      </div>
      <div class="profile-data-item">
        <div class="profile-data-label">Last Login</div>
        <div class="profile-data-value">
          ${lastLoginDate}
          ${
            lastLoginTime
              ? `<span class="text-muted">${lastLoginTime}</span>`
              : ""
          }
        </div>
      </div>
      <div class="profile-data-item">
        <div class="profile-data-label">Books Added</div>
        <div class="profile-data-value">${data.user.booksCount || 0}</div>
      </div>
    `;
  } catch (error) {
    console.error("Load profile error:", error);
    profileDataElement.innerHTML = `<div class="error-message">An error occurred while loading your profile.</div>`;
  }
}

// Handle update profile form submission
async function handleUpdateProfile(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const messageElement = document.getElementById("update-profile-message");

  try {
    // Reset message
    messageElement.textContent = "";
    messageElement.className = "message hidden";

    // Send update profile request
    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (!data.success) {
      // Show error message
      messageElement.textContent = data.message || "Update failed";
      messageElement.className = "message error";
      return;
    }

    // Show success message
    messageElement.textContent = "Profile updated successfully";
    messageElement.className = "message success";

    // Reload profile data
    loadUserProfile();
  } catch (error) {
    console.error("Update profile error:", error);
    messageElement.textContent =
      "An error occurred while updating your profile.";
    messageElement.className = "message error";
  }
}

// Handle change password form submission
async function handleChangePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const messageElement = document.getElementById("change-password-message");

  try {
    // Reset message
    messageElement.textContent = "";
    messageElement.className = "message hidden";

    // Send change password request
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!data.success) {
      // Show error message
      messageElement.textContent = data.message || "Password change failed";
      messageElement.className = "message error";
      return;
    }

    // Show success message and reset form
    messageElement.textContent = "Password changed successfully";
    messageElement.className = "message success";
    document.getElementById("change-password-form").reset();
  } catch (error) {
    console.error("Change password error:", error);
    messageElement.textContent =
      "An error occurred while changing your password.";
    messageElement.className = "message error";
  }
}

// Load user's reading list
async function loadReadingList() {
  const readingListElement = document.getElementById("reading-list");
  if (!readingListElement) return;

  try {
    // Show loading spinner
    readingListElement.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i> Loading reading list...
      </div>
    `;

    // Send request to get reading list
    const response = await fetch("/api/books/reading-list", {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      // If not authenticated, handled by loadUserProfile redirect
      return;
    }

    const data = await response.json();

    if (!data.success) {
      readingListElement.innerHTML = `<div class="error-message">Failed to load reading list: ${data.message}</div>`;
      return;
    }

    if (!data.books || data.books.length === 0) {
      readingListElement.innerHTML = `
        <div class="empty-message">
          <i class="fas fa-book-open"></i>
          <p>Your reading list is empty. Add books to start tracking your reading journey!</p>
        </div>
      `;
      return;
    }

    // Create HTML for books
    let booksHTML = "";

    data.books.forEach((book) => {
      let statusBadge = "";
      let statusClass = "";

      switch (book.status) {
        case "completed":
          statusBadge =
            '<span class="status-badge completed"><i class="fas fa-check-circle"></i> Completed</span>';
          statusClass = "completed";
          break;
        case "reading":
          statusBadge =
            '<span class="status-badge reading"><i class="fas fa-book-reader"></i> Currently Reading</span>';
          statusClass = "reading";
          break;
        case "wishlist":
          statusBadge =
            '<span class="status-badge wishlist"><i class="fas fa-clock"></i> Want to Read</span>';
          statusClass = "wishlist";
          break;
      }

      const addedDate = new Date(book.addedAt).toLocaleDateString();

      booksHTML += `
        <div class="reading-list-item" data-status="${
          book.status || "wishlist"
        }">
          <div class="reading-list-title">${book.title}</div>
          <div class="reading-list-author">by ${book.author}</div>
          <div class="reading-list-info">
            ${statusBadge}
            <div class="book-progress">
              ${
                book.progress
                  ? `<div class="progress-bar"><div style="width: ${book.progress}%"></div></div>`
                  : ""
              }
              ${
                book.progress
                  ? `<span class="progress-text">${book.progress}% complete</span>`
                  : ""
              }
            </div>
          </div>
          <div class="reading-list-meta">
            <span>Added: ${addedDate}</span>
            <div class="reading-list-actions">
              <button class="action-btn status-btn" title="Change status">
                <i class="fas fa-exchange-alt"></i>
              </button>
              <button class="action-btn remove-btn" title="Remove from list">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    readingListElement.innerHTML = booksHTML;

    // Add event listeners for action buttons
    document.querySelectorAll(".status-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        alert("Status change functionality coming soon!");
      });
    });

    document.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        if (
          confirm(
            "Are you sure you want to remove this book from your reading list?"
          )
        ) {
          alert("Remove functionality coming soon!");
        }
      });
    });
  } catch (error) {
    console.error("Load reading list error:", error);
    readingListElement.innerHTML = `<div class="error-message">An error occurred while loading your reading list.</div>`;
  }
}

// Check authentication status
async function checkAuthStatus() {
  try {
    // Send request to get profile data
    const response = await fetch("/api/auth/profile", {
      method: "GET",
      credentials: "include",
    });

    const isLoggedIn = response.status === 200;

    // Add login/logout links in header if available
    updateHeaderLinks(isLoggedIn);
  } catch (error) {
    console.error("Auth check error:", error);
  }
}

// Update header links based on authentication status
function updateHeaderLinks(isLoggedIn) {
  const headerAuthElement = document.querySelector(".header-auth");
  if (!headerAuthElement) return;

  if (isLoggedIn) {
    headerAuthElement.innerHTML = `
      <a href="/profile.html" class="profile-link">
        <i class="fas fa-user-circle"></i> My Profile
      </a>
      <a href="/" class="auth-link">
        <i class="fas fa-book"></i> Recommendations
      </a>
    `;
  } else {
    headerAuthElement.innerHTML = `
      <a href="/login.html" class="auth-link">Login</a>
      <a href="/register.html" class="auth-link register">Register</a>
    `;
  }
}

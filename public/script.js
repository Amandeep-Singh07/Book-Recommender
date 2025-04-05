// Initialize theme from localStorage or default to light
const currentTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", currentTheme);

// Initialize recent queries array from localStorage or empty array
let recentQueries = JSON.parse(localStorage.getItem("recentQueries")) || [];

// Display recent queries when page loads
document.addEventListener("DOMContentLoaded", function () {
  displayRecentQueries();

  // Set up theme toggle button
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  updateThemeToggleButton(currentTheme);

  themeToggleBtn.addEventListener("click", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    updateThemeToggleButton(newTheme);
  });
});

// Update theme toggle button text and icon
function updateThemeToggleButton(theme) {
  const button = document.getElementById("theme-toggle-btn");
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

async function getRecommendations() {
  const favoriteBooks = document.getElementById("favorite-books").value;

  // Get selected genres - ensure we're getting all selected options
  const genresSelect = document.getElementById("favorite-genres");
  const genres = Array.from(genresSelect.selectedOptions).map(
    (option) => option.value
  );

  const readingLevel = document.getElementById("reading-level").value;
  const additionalPreferences = document.getElementById(
    "additional-preferences"
  ).value;

  // Save query to recent queries
  const queryData = {
    favoriteBooks,
    genres: genres.join(", "),
    readingLevel,
    additionalPreferences,
    timestamp: new Date().toISOString(),
  };

  saveRecentQuery(queryData);

  const recommendationsDiv = document.getElementById("recommendations");
  const loadingDiv = document.getElementById("loading");

  // Show loading message
  loadingDiv.classList.remove("hidden");
  recommendationsDiv.innerHTML = "";

  // Prepare prompt for AI
  const prompt = `I want book recommendations based on the following preferences:
    Favorite books: ${favoriteBooks || "None specified"}
    Preferred genres: ${genres.length > 0 ? genres.join(", ") : "Any"}
    Reading level: ${readingLevel}
    Additional preferences: ${additionalPreferences || "None specified"}
    
    Please provide 5 book recommendations. For each book, include:
    1. Title (prefix with "Title:")
    2. Author (prefix with "Author:")
    3. A brief description (prefix with "Description:")
    4. Why I might enjoy it based on my preferences (prefix with "Why you might enjoy it:")
    
    Number each recommendation clearly (e.g., "Recommendation 1:").`;

  try {
    const response = await fetch("http://localhost:5001/get-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    // Hide loading message
    loadingDiv.classList.add("hidden");

    // Process and display recommendations
    if (data.response) {
      const recommendations = processMarkdownRecommendations(data.response);
      displayRecommendations(recommendations);
    } else {
      recommendationsDiv.innerHTML =
        "<p>Sorry, we couldn't generate recommendations at this time. Please try again later.</p>";
    }
  } catch (error) {
    console.error("Error:", error);
    loadingDiv.classList.add("hidden");
    recommendationsDiv.innerHTML =
      "<p>Error connecting to recommendation service. Please try again later.</p>";
  }
}

function processMarkdownRecommendations(responseText) {
  // This function parses markdown-formatted AI responses
  const books = [];

  // Split the response by recommendation sections
  const recommendationSections = responseText.split(/Recommendation \d+/i);

  // Skip the first element if it's just introductory text
  const sections = recommendationSections.slice(1);

  sections.forEach((section) => {
    // Extract title
    const titleMatch = section.match(/Title:(.*?)(?=Author:|$)/is);
    const title = titleMatch
      ? titleMatch[1].replace(/\*/g, "").trim()
      : "Unknown Title";

    // Extract author
    const authorMatch = section.match(
      /Author:(.*?)(?=Brief Description:|Description:|$)/is
    );
    const author = authorMatch
      ? authorMatch[1].replace(/\*/g, "").trim()
      : "Unknown Author";

    // Extract description
    const descriptionMatch = section.match(
      /(Brief Description:|Description:)(.*?)(?=Why you might enjoy it:|$)/is
    );
    const description = descriptionMatch
      ? descriptionMatch[2].replace(/\*/g, "").trim()
      : "";

    // Extract why you might enjoy it
    const whyMatch = section.match(
      /Why you might enjoy it:(.*?)(?=Recommendation \d+|$)/is
    );
    const whyText = whyMatch ? whyMatch[1].replace(/\*/g, "").trim() : "";

    // Create a book object and add to the array
    const book = {
      title,
      author,
      description:
        description + (whyText ? "\n\nWhy you might enjoy it: " + whyText : ""),
    };

    // Only add books that have at least a title
    if (title !== "Unknown Title") {
      books.push(book);
    }
  });

  // If parsing fails, return the whole response as a single recommendation
  if (books.length === 0 && responseText.trim()) {
    // Second attempt: Try to extract individual books even if the section headers don't match
    const titleMatches = responseText.match(/Title:(.*?)(?=Author:|$)/gim);

    if (titleMatches && titleMatches.length > 0) {
      // Extract books by title
      titleMatches.forEach((match, index) => {
        const startIndex = responseText.indexOf(match);
        const nextMatch = titleMatches[index + 1];
        const endIndex = nextMatch
          ? responseText.indexOf(nextMatch)
          : responseText.length;

        const bookSection = responseText.substring(startIndex, endIndex);

        // Extract title
        const titleMatch = bookSection.match(/Title:(.*?)(?=Author:|$)/is);
        const title = titleMatch
          ? titleMatch[1].replace(/\*/g, "").trim()
          : "Unknown Title";

        // Extract author
        const authorMatch = bookSection.match(
          /Author:(.*?)(?=Brief Description:|Description:|$)/is
        );
        const author = authorMatch
          ? authorMatch[1].replace(/\*/g, "").trim()
          : "Unknown Author";

        // Extract remaining content as description
        let description = bookSection;
        if (titleMatch) description = description.replace(titleMatch[0], "");
        if (authorMatch) description = description.replace(authorMatch[0], "");
        description = description.replace(/\*/g, "").trim();

        books.push({ title, author, description });
      });
    } else {
      // Last resort: return the whole text
      books.push({
        title: "Recommendations",
        author: "",
        description: responseText,
      });
    }
  }

  return books;
}

function displayRecommendations(books) {
  const recommendationsDiv = document.getElementById("recommendations");
  recommendationsDiv.innerHTML = "";

  if (books.length === 0) {
    recommendationsDiv.innerHTML =
      "<p>No recommendations found. Please try with different preferences.</p>";
    return;
  }

  books.forEach((book, index) => {
    const bookElement = document.createElement("div");
    bookElement.className = "book-recommendation";

    const titleElement = document.createElement("div");
    titleElement.className = "book-title";
    titleElement.textContent = `${index + 1}. ${book.title}`;

    const authorElement = document.createElement("div");
    authorElement.className = "book-author";
    authorElement.textContent = book.author ? `by ${book.author}` : "";

    const descriptionElement = document.createElement("div");
    descriptionElement.className = "book-description";

    // Format the description with paragraphs
    const descriptionParagraphs = book.description.split("\n\n");
    descriptionParagraphs.forEach((paragraph) => {
      if (paragraph.trim()) {
        const p = document.createElement("p");
        p.textContent = paragraph.trim();
        descriptionElement.appendChild(p);
      }
    });

    bookElement.appendChild(titleElement);
    if (book.author) bookElement.appendChild(authorElement);
    bookElement.appendChild(descriptionElement);

    recommendationsDiv.appendChild(bookElement);
  });
}

// Save a query to recent queries list
function saveRecentQuery(queryData) {
  // Add to beginning of array
  recentQueries.unshift(queryData);

  // Keep only the most recent 5 queries
  if (recentQueries.length > 5) {
    recentQueries = recentQueries.slice(0, 5);
  }

  // Save to localStorage
  localStorage.setItem("recentQueries", JSON.stringify(recentQueries));

  // Update the display
  displayRecentQueries();
}

// Display the recent queries in the UI
function displayRecentQueries() {
  const recentQueriesList = document.getElementById("recent-queries-list");

  if (recentQueries.length === 0) {
    recentQueriesList.innerHTML =
      '<p class="empty-message">Your recent searches will appear here</p>';
    return;
  }

  recentQueriesList.innerHTML = "";

  recentQueries.forEach((query, index) => {
    const queryItem = document.createElement("div");
    queryItem.className = "query-item";

    // Format the date nicely
    const date = new Date(query.timestamp);
    const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;

    // Create summary of the query
    let querySummary = "";
    if (query.favoriteBooks) {
      querySummary += `Books: ${query.favoriteBooks.substring(0, 30)}${
        query.favoriteBooks.length > 30 ? "..." : ""
      } | `;
    }
    if (query.genres) {
      querySummary += `Genres: ${query.genres} | `;
    }
    querySummary += `Level: ${query.readingLevel}`;

    queryItem.innerHTML = `
      <div><strong>${querySummary}</strong></div>
      <div><small>${formattedDate}</small></div>
    `;

    // Add click event to reuse this query
    queryItem.addEventListener("click", () => reuseQuery(query));

    recentQueriesList.appendChild(queryItem);
  });
}

// Reuse a previous query
function reuseQuery(query) {
  document.getElementById("favorite-books").value = query.favoriteBooks || "";

  // Set selected genres
  const genresSelect = document.getElementById("favorite-genres");
  const genresArray = query.genres.split(", ").filter((g) => g);

  // First deselect all options
  Array.from(genresSelect.options).forEach((option) => {
    option.selected = false;
  });

  // Then select the ones from the query
  Array.from(genresSelect.options).forEach((option) => {
    if (genresArray.includes(option.value)) {
      option.selected = true;
    }
  });

  // Set reading level
  document.getElementById("reading-level").value = query.readingLevel || "any";

  // Set additional preferences
  document.getElementById("additional-preferences").value =
    query.additionalPreferences || "";

  // Scroll to the top of preferences section
  document
    .querySelector(".preferences-section")
    .scrollIntoView({ behavior: "smooth" });
}

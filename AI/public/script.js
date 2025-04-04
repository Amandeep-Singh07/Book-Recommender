// async function askNVIDIA() {
//   const userInput = document.getElementById("user-input").value;
//   const responseText = document.getElementById("response");

//   responseText.innerText = "Loading..."; // Show loading message

//   try {
//     const response = await fetch("http://localhost:5000/get-response", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ prompt: userInput }),
//     });

//     const data = await response.json();
//     responseText.innerText = data.response || "No response received.";
//   } catch (error) {
//     responseText.innerText = "Error connecting to NVIDIA AI.";
//     console.error("Error:", error);
//   }
// }

// async function getRecommendations() {
//   const favoriteBooks = document.getElementById("favorite-books").value;
//   const genres = Array.from(
//     document.getElementById("favorite-genres").selectedOptions
//   ).map((option) => option.value);
//   const readingLevel = document.getElementById("reading-level").value;
//   const additionalPreferences = document.getElementById(
//     "additional-preferences"
//   ).value;

//   const recommendationsDiv = document.getElementById("recommendations");
//   const loadingDiv = document.getElementById("loading");

//   // Show loading message
//   loadingDiv.classList.remove("hidden");
//   recommendationsDiv.innerHTML = "";

//   // Prepare prompt for AI
//   const prompt = `I want book recommendations based on the following preferences:
//     Favorite books: ${favoriteBooks || "None specified"}
//     Preferred genres: ${genres.length > 0 ? genres.join(", ") : "Any"}
//     Reading level: ${readingLevel}
//     Additional preferences: ${additionalPreferences || "None specified"}
    
//     Please provide 5 book recommendations. For each book, include the title, author, a brief description, and why I might enjoy it based on my preferences. Format each recommendation clearly.`;

//   try {
//     const response = await fetch("http://localhost:5000/get-response", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ prompt }),
//     });

//     const data = await response.json();

//     // Hide loading message
//     loadingDiv.classList.add("hidden");

//     // Process and display recommendations
//     if (data.response) {
//       const recommendations = processRecommendations(data.response);
//       displayRecommendations(recommendations);
//     } else {
//       recommendationsDiv.innerHTML =
//         "<p>Sorry, we couldn't generate recommendations at this time. Please try again later.</p>";
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     loadingDiv.classList.add("hidden");
//     recommendationsDiv.innerHTML =
//       "<p>Error connecting to recommendation service. Please try again later.</p>";
//   }
// }

// function processRecommendations(responseText) {
//   // Simple parsing logic - split by numbered recommendations
//   // This is a basic implementation; you might want to improve this
//   // based on the actual format of the AI responses

//   const books = [];

//   // Look for patterns like "1.", "2.", etc. to split recommendations
//   const regex = /(\d+\.\s+([^:]+)(?:\s+by\s+|\s+-\s+)([^:]+))/g;
//   let matches;
//   let lastIndex = 0;

//   while ((matches = regex.exec(responseText)) !== null) {
//     const startIndex = matches.index;

//     // If this isn't the first match, add the previous recommendation
//     if (lastIndex > 0) {
//       const prevRecommendation = responseText
//         .substring(lastIndex, startIndex)
//         .trim();
//       const lastBook = books[books.length - 1];

//       if (lastBook) {
//         lastBook.description = prevRecommendation;
//       }
//     }

//     // Extract title and author
//     const fullMatch = matches[1]; // The entire match (e.g., "1. The Great Gatsby by F. Scott Fitzgerald")
//     const title = matches[2].trim();
//     const author = matches[3].trim();

//     books.push({
//       title,
//       author,
//       description: "", // Will be filled in the next iteration or at the end
//     });

//     lastIndex = startIndex + fullMatch.length;
//   }

//   // Handle the last recommendation
//   if (books.length > 0 && lastIndex < responseText.length) {
//     const lastRecommendation = responseText.substring(lastIndex).trim();
//     books[books.length - 1].description = lastRecommendation;
//   }

//   // If regex parsing fails, return the whole response as a single recommendation
//   if (books.length === 0 && responseText.trim()) {
//     books.push({
//       title: "Recommendations",
//       author: "",
//       description: responseText,
//     });
//   }

//   return books;
// }

// function displayRecommendations(books) {
//   const recommendationsDiv = document.getElementById("recommendations");
//   recommendationsDiv.innerHTML = "";

//   if (books.length === 0) {
//     recommendationsDiv.innerHTML =
//       "<p>No recommendations found. Please try with different preferences.</p>";
//     return;
//   }

//   books.forEach((book) => {
//     const bookElement = document.createElement("div");
//     bookElement.className = "book-recommendation";

//     const titleElement = document.createElement("div");
//     titleElement.className = "book-title";
//     titleElement.textContent = book.title;

//     const authorElement = document.createElement("div");
//     authorElement.className = "book-author";
//     authorElement.textContent = book.author ? `by ${book.author}` : "";

//     const descriptionElement = document.createElement("div");
//     descriptionElement.className = "book-description";
//     descriptionElement.textContent = book.description;

//     bookElement.appendChild(titleElement);
//     if (book.author) bookElement.appendChild(authorElement);
//     bookElement.appendChild(descriptionElement);

//     recommendationsDiv.appendChild(bookElement);
//   });
// }

async function getRecommendations() {
  const favoriteBooks = document.getElementById("favorite-books").value;
  const genres = Array.from(
    document.getElementById("favorite-genres").selectedOptions
  ).map((option) => option.value);
  const readingLevel = document.getElementById("reading-level").value;
  const additionalPreferences = document.getElementById(
    "additional-preferences"
  ).value;

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
    const response = await fetch("http://localhost:5000/get-response", {
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

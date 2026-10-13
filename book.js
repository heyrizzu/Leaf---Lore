
// Find HTML elements
const booksContainer = document.getElementById("booksContainer");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const bookCount = document.getElementById("bookCount");
const pagination = document.getElementById("pagination");
const categoryButtons = document.querySelectorAll(".category");

// Store books and settings
let allBooks = [];
let currentPage = 1;
const booksPerPage = 20;
let selectedCategory = "All";

// Book cover placeholder
const placeholder =
    "https://placehold.co/220x300/211e18/d4af67?text=No+Cover";

// Load books from Open Library
async function loadBooks() {
    booksContainer.textContent = "Loading books...";

    try {
        const response = await fetch(
            "https://openlibrary.org/search.json?q=subject:fiction&limit=1000"
        );

        if (!response.ok) {
            throw new Error("Book API request failed");
        }

        const data = await response.json();

        // Convert API results into our book format
        allBooks = data.docs.map((book, index) => ({
            id: index,
            title: book.title || "Untitled",
            author: book.author_name?.[0] || "Unknown Author",
            subjects: book.subject || [],
            cover: book.cover_i
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : "",
            link: book.key
                ? `https://openlibrary.org${book.key}`
                : "https://openlibrary.org"
        }));

        displayBooks();
    } catch (error) {
        console.error("Error loading books:", error);

        booksContainer.textContent =
            "Unable to load books. Check your internet and try again.";

        bookCount.textContent = "Books could not be loaded.";
    }
}

// Assign a simple category to each book
function getCategory(book) {
    const subjects = book.subjects
        .map(subject => subject.toLowerCase());

    const categories = [
        ["Technology", ["computer", "programming", "technology"]],
        ["Science", ["science", "physics", "chemistry", "biology"]],
        ["History", ["history", "historical"]],
        ["Fantasy", ["fantasy", "magic"]],
        ["Mystery", ["mystery", "detective"]],
        ["Biography", ["biography", "autobiography"]]
    ];

    for (const [name, keywords] of categories) {
        if (subjects.some(subject =>
            keywords.some(keyword => subject.includes(keyword))
        )) {
            return name;
        }
    }

    return "Fiction";
}

// Filter books by search and category
function getFilteredBooks() {
    const query = searchInput.value.toLowerCase().trim();

    return allBooks.filter(book => {
        const matchesSearch =
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query);

        const matchesCategory =
            selectedCategory === "All" ||
            getCategory(book) === selectedCategory;

        return matchesSearch && matchesCategory;
    });
}

// Display current page
function displayBooks() {
    const filteredBooks = getFilteredBooks();

    const totalPages = Math.ceil(
        filteredBooks.length / booksPerPage
    );

    currentPage = Math.max(
        1,
        Math.min(currentPage, totalPages || 1)
    );

    const start = (currentPage - 1) * booksPerPage;

    const visibleBooks = filteredBooks.slice(
        start,
        start + booksPerPage
    );

    booksContainer.replaceChildren();

    bookCount.textContent =
        `Showing ${visibleBooks.length} of ${filteredBooks.length} books`;

    // Show message if no results
    if (visibleBooks.length === 0) {
        booksContainer.textContent =
            "No books found. Try another search.";
        renderPagination(0);
        return;
    }

    // Create each book card
    visibleBooks.forEach(book => {
        const card = document.createElement("article");
        card.className = "book-card";

        const image = document.createElement("img");
        image.className = "book-cover";
        image.src = book.cover || placeholder;
        image.alt = `Cover of ${book.title}`;
        image.loading = "lazy";

        // Use placeholder if the cover fails to load
        image.onerror = () => {
            image.onerror = null;
            image.src = placeholder;
        };

        const title = document.createElement("h3");
        title.textContent = book.title;

        const author = document.createElement("p");
        author.className = "book-author";
        author.textContent = book.author;

        const category = document.createElement("span");
        category.className = "book-category";
        category.textContent = getCategory(book);

        const link = document.createElement("a");
        link.className = "book-link";
        link.href = book.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "📖 View Book";

        card.append(
            image,
            title,
            author,
            category,
            link
        );

        booksContainer.appendChild(card);
    });

    renderPagination(totalPages);
}

// Create Previous, page-number, and Next buttons
function renderPagination(totalPages) {
    pagination.replaceChildren();

    if (totalPages <= 1) {
        return;
    }

    function addButton(label, page, disabled = false, active = false) {
        const button = document.createElement("button");

        button.textContent = label;
        button.disabled = disabled;

        if (active) {
            button.classList.add("active");
        }

        button.onclick = () => {
            currentPage = page;
            displayBooks();

            document.getElementById("books")
                .scrollIntoView({ behavior: "smooth" });
        };

        pagination.appendChild(button);
    }

    addButton("←", currentPage - 1, currentPage === 1);

    // Display nearby page numbers
    for (
        let page = Math.max(1, currentPage - 2);
        page <= Math.min(totalPages, currentPage + 2);
        page++
    ) {
        addButton(
            String(page),
            page,
            false,
            page === currentPage
        );
    }

    addButton(
        "→",
        currentPage + 1,
        currentPage === totalPages
    );
}

// Search as the user types
searchInput.addEventListener("input", () => {
    currentPage = 1;
    displayBooks();
});

// Search button
searchButton.addEventListener("click", () => {
    currentPage = 1;
    displayBooks();
});

// Category filter buttons
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;

        categoryButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        currentPage = 1;
        displayBooks();
    });
});

// Start the library
loadBooks();
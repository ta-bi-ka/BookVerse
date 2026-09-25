(() => {
    const bookId = Number(
        new URLSearchParams(window.location.search).get("id")
    );

    const button = document.getElementById("show-reviews");
    const panel = document.getElementById("reviews-panel");
    const status = document.getElementById("reviews-status");
    const list = document.getElementById("reviews-list");
    const form = document.getElementById("review-form");
    const submit = document.getElementById("submit-review");

    let opening = false;
    let isLibrarian = false;

    async function getJson(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            ...options,
        });

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            throw new Error(result.message || "The request failed.");
        }

        return result.data;
    }

    function addText(parent, value) {
        const paragraph = document.createElement("p");
        paragraph.textContent = value;
        parent.appendChild(paragraph);
    }

    async function loadReviews() {
        const reviews = await getJson(
            `/api/reviews/book/${encodeURIComponent(bookId)}`
        );

        if (!Array.isArray(reviews)) {
            throw new Error("Could not load reviews.");
        }

        list.replaceChildren();

        if (reviews.length === 0) {
            addText(list, "No reviews yet.");
        }

        for (const review of reviews) {
            const card = document.createElement("article");
            card.className = "book-card";
            if (isLibrarian) {
                card.classList.add("review-card");
            }
            const name = document.createElement("h3");
            name.textContent =
                review.full_name || review.username || "Reader";

            card.appendChild(name);
            addText(card, `Rating: ${review.rating} / 5`);
            if (isLibrarian) {
                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "nav-logout review-remove-button";
                removeButton.textContent = "Remove";
                removeButton.setAttribute(
                    "aria-label",
                    `Remove review by ${review.full_name || review.username || "reader"}`
                );

                removeButton.addEventListener("click", async () => {
                    if (!window.confirm("Remove this review permanently?")) return;

                    removeButton.disabled = true;

                    try {
                        await getJson(
                            `/api/reviews/${encodeURIComponent(review.review_id)}`,
                            { method: "DELETE" }
                        );

                        await loadReviews();
                        status.textContent = "Review removed.";
                    } catch (error) {
                        status.textContent = error.message;
                        removeButton.disabled = false;
                    }
                });

                card.appendChild(removeButton);
            }

            if (review.review_text) {
                addText(card, review.review_text);
            }

            list.appendChild(card);
        }

        return reviews;
    }

    async function checkReviewEligibility(reviews) {
        form.hidden = true;

        let session;

        try {
            session = await getJson("/api/auth/session");
        } catch {
            return; // Reviews remain public to logged-out visitors.
        }

        if (session.roleName !== "Student") return;

        const ownReview = reviews.some(
            (review) => Number(review.user_id) === Number(session.userId)
        );

        if (ownReview) {
            addText(list, "You have already reviewed this book.");
            return;
        }

        const borrows = await getJson("/api/borrows/my");

        if (!Array.isArray(borrows)) {
            throw new Error("Could not check your borrowing history.");
        }

        const hasConfirmedBorrow = borrows.some(
            (borrow) => Number(borrow.book_id) === bookId
        );

        if (hasConfirmedBorrow) {
            form.hidden = false;
        }
    }

    async function openReviews() {
        if (opening || !Number.isSafeInteger(bookId) || bookId <= 0) {
            return;
        }

        opening = true;
        panel.hidden = false;
        status.textContent = "Loading reviews...";

        try {
            const session = await getJson("/api/auth/session");
            isLibrarian = session.roleName === "Librarian";
        } catch {
            isLibrarian = false;
        }

        try {
            const reviews = await loadReviews();
            await checkReviewEligibility(reviews);
            status.textContent = "";
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
            status.textContent = error.message;
        } finally {
            opening = false;
        }
    }

    button.addEventListener("click", openReviews);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submit.disabled = true;
        status.textContent = "Submitting your review...";

        try {
            await getJson("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookId,
                    rating: Number(
                        document.getElementById("review-rating").value
                    ),
                    reviewText:
                        document.getElementById("review-text").value.trim(),
                }),
            });

            form.reset();
            form.hidden = true;

            const reviews = await loadReviews();
            status.textContent = "Review submitted.";

            // The newly created review is now in the public list.
            if (!Array.isArray(reviews)) {
                throw new Error("Refresh the page to see your review.");
            }
        } catch (error) {
            status.textContent = error.message;
        } finally {
            submit.disabled = false;
        }
    });

    if (new URLSearchParams(window.location.search).get("review") === "1") {
        openReviews();
    }
})();
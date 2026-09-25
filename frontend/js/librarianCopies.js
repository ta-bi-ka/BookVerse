(() => {
    const status = document.getElementById("copies-status");
    const content = document.getElementById("copies-content");
    const list = document.getElementById("copies-list");
    const search = document.getElementById("copy-search");

    const form = document.getElementById("add-copy-form");
    const addButton = document.getElementById("add-copy-button");

    const bookSelect = document.getElementById("copy-book");
    const barcodeInput = document.getElementById("copy-barcode");
    const conditionInput = document.getElementById("copy-condition");
    const locationInput = document.getElementById("copy-location");
    const dateInput = document.getElementById("copy-date");

    let books = [];
    let copies = [];
    let activeLoans = new Map();
    async function api(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            ...options,
        });

        if (response.status === 401) {
            window.location.assign("/pages/public/login.html");
            throw new Error("Please log in.");
        }

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            throw new Error(
                result.message || "The request could not be completed."
            );
        }

        return result.data;
    }

    function makeText(tag, value) {
        const element = document.createElement(tag);
        element.textContent = value;
        return element;
    }

    function makeInput(labelText, value, maxLength) {
        const wrapper = document.createElement("label");
        wrapper.className = "form-field";
        wrapper.textContent = labelText;

        const input = document.createElement("input");
        input.value = value || "";
        input.maxLength = maxLength;

        wrapper.appendChild(input);
        return { wrapper, input };
    }

    function render() {
        list.replaceChildren();

        const term = search.value.trim().toLowerCase();
        let shown = 0;

        for (const book of books) {
            const bookCopies = copies.filter(
                (copy) => Number(copy.book_id) === Number(book.book_id)
            );

            const matchesBook =
                String(book.title || "").toLowerCase().includes(term) ||
                String(book.isbn || "").toLowerCase().includes(term);

            const matchingCopies = term && !matchesBook
                ? bookCopies.filter((copy) =>
                    String(copy.barcode || "")
                        .toLowerCase()
                        .includes(term)
                )
                : bookCopies;

            if (term && !matchesBook && matchingCopies.length === 0) {
                continue;
            }

            shown += 1;

            const section = document.createElement("section");
            section.className = "book-card";
            section.style.marginTop = "16px";

            const heading = makeText(
                "h3",
                `${book.title || "Untitled book"} — ${bookCopies.length
                } ${bookCopies.length === 1 ? "copy" : "copies"}`
            );

            const availableCount = bookCopies.filter(
                (copy) => copy.status === "available"
            ).length;

            section.append(
                heading,
                makeText(
                    "p",
                    `${availableCount} available · ISBN: ${book.isbn || "Not listed"
                    }`
                )
            );

            if (matchingCopies.length === 0) {
                section.appendChild(
                    makeText("p", "No physical copies recorded.")
                );
            }

            for (const copy of matchingCopies) {
                const item = document.createElement("div");
                item.style.borderTop = "1px solid #cfddd4";
                item.style.padding = "16px 0";

                item.appendChild(
                    makeText(
                        "h4",
                        `Barcode: ${copy.barcode}`
                    )
                );

                item.appendChild(
                    makeText(
                        "p",
                        `Current status: ${copy.status}`
                    )
                );

                // Loan status must change through librarian approval
                // of a borrow or return request.
                if (
                    copy.status === "borrowed" ||
                    copy.status === "reserved"
                ) {
                    if (copy.status === "borrowed") {
                        const loan = activeLoans.get(Number(copy.copy_id));

                        if (loan) {
                            item.appendChild(
                                makeText(
                                    "p",
                                    `Borrowed by: ${loan.full_name} (@${loan.username})`
                                )
                            );

                            item.appendChild(
                                makeText(
                                    "p",
                                    `Due date: ${new Date(
                                        loan.due_date
                                    ).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "UTC",
                                    })}`
                                )
                            );
                        } else {
                            item.appendChild(
                                makeText(
                                    "p",
                                    "Borrowed copy has no matching active loan. Check the records."
                                )
                            );
                        }
                    }

                    item.appendChild(
                        makeText(
                            "p",
                            "This copy's status is managed through the borrowing workflow."
                        )
                    );

                    section.appendChild(item);
                    continue;
                }

                const statusLabel = document.createElement("label");
                statusLabel.className = "form-field";
                statusLabel.textContent = "Status";

                const statusSelect = document.createElement("select");

                for (const value of [
                    "available",
                    "lost",
                    "damaged",
                    "inactive",
                ]) {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = value;
                    option.selected = copy.status === value;
                    statusSelect.appendChild(option);
                }

                statusLabel.appendChild(statusSelect);

                const condition = makeInput(
                    "Condition",
                    copy.condition,
                    20
                );

                const location = makeInput(
                    "Shelf location",
                    copy.shelf_location,
                    30
                );

                const save = document.createElement("button");
                save.type = "button";
                save.className = "auth-button";
                save.textContent = "Save changes";

                save.addEventListener("click", async () => {
                    save.disabled = true;
                    status.textContent =
                        `Saving copy ${copy.barcode}...`;

                    try {
                        await api(
                            `/api/book-copies/${encodeURIComponent(
                                copy.copy_id
                            )}`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    bookId: copy.book_id,
                                    barcode: copy.barcode,
                                    status: statusSelect.value,
                                    condition:
                                        condition.input.value.trim() || null,
                                    shelfLocation:
                                        location.input.value.trim() || null,
                                    acquisitionDate:
                                        copy.acquisition_date
                                            ? String(copy.acquisition_date)
                                                .slice(0, 10)
                                            : null,
                                }),
                            }
                        );

                        await loadInventory();
                        status.textContent =
                            "Copy updated successfully.";
                    } catch (error) {
                        status.textContent = error.message;
                        save.disabled = false;
                    }
                });

                item.append(
                    statusLabel,
                    condition.wrapper,
                    location.wrapper,
                    save
                );

                section.appendChild(item);
            }

            list.appendChild(section);
        }

        if (shown === 0) {
            list.appendChild(
                makeText("p", "No matching books or copies.")
            );
        }
    }

    async function loadInventory() {
        const [bookData, copyData, loanData] = await Promise.all([
            api("/api/books"),
            api("/api/book-copies"),
            api("/api/borrows"),
        ]);

        if (
            !Array.isArray(bookData) ||
            !Array.isArray(copyData) ||
            !Array.isArray(loanData)
        ) {
            throw new Error(
                "The server returned an unexpected inventory response."
            );
        }

        books = bookData;
        copies = copyData;

        activeLoans = new Map(
            loanData
                .filter((loan) => loan.return_date === null)
                .map((loan) => [Number(loan.copy_id), loan])
        );

        if (
            !Array.isArray(bookData) ||
            !Array.isArray(copyData)
        ) {
            throw new Error(
                "The server returned an unexpected inventory response."
            );
        }

        books = bookData;
        copies = copyData;

        const selectedId = bookSelect.value;
        bookSelect.replaceChildren();

        for (const book of books) {
            const option = document.createElement("option");
            option.value = book.book_id;
            option.textContent =
                `${book.title || "Untitled book"} ${book.isbn ? `(${book.isbn})` : ""
                }`;

            bookSelect.appendChild(option);
        }

        if (
            books.some(
                (book) => String(book.book_id) === selectedId
            )
        ) {
            bookSelect.value = selectedId;
        }

        addButton.disabled = books.length === 0;
        render();
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        addButton.disabled = true;
        status.textContent = "Adding copy...";

        try {
            await api("/api/book-copies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bookId: Number(bookSelect.value),
                    barcode: barcodeInput.value.trim(),
                    status: "available",
                    condition:
                        conditionInput.value.trim() || null,
                    shelfLocation:
                        locationInput.value.trim() || null,
                    acquisitionDate: dateInput.value || null,
                }),
            });

            barcodeInput.value = "";
            conditionInput.value = "";
            locationInput.value = "";
            dateInput.value = "";

            await loadInventory();
            status.textContent =
                "Copy added successfully.";
        } catch (error) {
            status.textContent = error.message;
        } finally {
            addButton.disabled = books.length === 0;
        }
    });

    search.addEventListener("input", render);

    async function start() {
        try {
            const session = await api(
                "/api/auth/session"
            );

            if (
                session.roleName !== "Librarian" &&
                session.roleName !== "Admin"
            ) {
                status.textContent =
                    "This page is available to library staff only.";
                return;
            }

            content.hidden = false;
            status.textContent = "Loading book copies...";
            await loadInventory();
            status.textContent = "";
        } catch (error) {
            status.textContent = error.message;
        }
    }

    start();
})();
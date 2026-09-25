const reservationsStatus = document.getElementById("reservations-status");
const reservationsList = document.getElementById("reservations-list");

async function loadMyReservations() {
    reservationsStatus.textContent = "Loading reservations...";
    reservationsList.replaceChildren();

    try {
        const response = await fetch("/api/reservations/my", {
            credentials: "same-origin",
            cache: "no-store",
        });

        if (response.status === 401) {
            window.location.assign("/pages/public/login.html");
            return;
        }

        if (response.status === 403) {
            reservationsStatus.textContent =
                "Reservations are available to Student accounts only.";
            return;
        }

        const result = await response.json();

        if (
            !response.ok ||
            result.success !== true ||
            !Array.isArray(result.data)
        ) {
            throw new Error("Could not load reservations");
        }

        if (result.data.length === 0) {
            reservationsStatus.textContent = "You have no reservations yet.";
            return;
        }

        reservationsStatus.textContent =
            `${result.data.length} reservation(s).`;

        for (const reservation of result.data) {
            const card = document.createElement("article");
            card.className = "borrow-record";

            const heading = document.createElement("h3");
            const link = document.createElement("a");
            link.className = "book-title-link";
            link.href =
                `/pages/public/book-details.html?id=${encodeURIComponent(reservation.book_id)}`;
            link.textContent = reservation.title || "Untitled book";
            heading.appendChild(link);

            const status = document.createElement("p");
            status.textContent = `Status: ${reservation.status}`;

            card.append(heading, status);

            if (reservation.status === "active") {
                const position = document.createElement("p");
                position.textContent =
                    `Queue position: ${reservation.queue_position}`;
                card.appendChild(position);

                const cancelButton = document.createElement("button");
                cancelButton.type = "button";
                cancelButton.className = "auth-button";
                cancelButton.textContent = "Cancel reservation";

                const message = document.createElement("p");
                message.setAttribute("role", "status");

                cancelButton.addEventListener("click", async () => {
                    if (!window.confirm("Cancel this reservation?")) return;

                    cancelButton.disabled = true;
                    message.textContent = "Cancelling reservation...";

                    try {
                        const cancelResponse = await fetch(
                            `/api/reservations/${encodeURIComponent(reservation.reservation_id)}/cancel`,
                            {
                                method: "POST",
                                credentials: "same-origin",
                            }
                        );

                        if (cancelResponse.status === 401) {
                            window.location.assign("/pages/public/login.html");
                            return;
                        }

                        const cancelResult = await cancelResponse.json();

                        if (!cancelResponse.ok || cancelResult.success !== true) {
                            message.textContent =
                                cancelResult.message || "Could not cancel the reservation.";
                            cancelButton.disabled = false;
                            return;
                        }

                        await loadMyReservations();
                    } catch (error) {
                        message.textContent =
                            "Could not confirm cancellation. Refresh the page to check its status.";
                    }
                });

                card.append(cancelButton, message);
            }

            reservationsList.appendChild(card);
        }
    } catch (error) {
        reservationsStatus.textContent =
            "Could not load reservations. Refresh the page and try again.";
    }
}

loadMyReservations();
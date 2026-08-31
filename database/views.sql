-- BookVerse reusable database views

CREATE OR REPLACE VIEW vw_book_catalog AS
SELECT
    b.book_id,
    b.isbn,
    b.title,
    b.description,
    b.language,
    b.edition,
    b.publication_year,
    b.total_pages,
    p.publisher_name,

    COALESCE(
        (
            SELECT string_agg(
                a.author_name,
                ', '
                ORDER BY a.author_name
            )
            FROM book_authors ba
            JOIN authors a
                ON a.author_id = ba.author_id
            WHERE ba.book_id = b.book_id
        ),
        ''
    ) AS authors,

    COALESCE(
        (
            SELECT string_agg(
                g.genre_name,
                ', '
                ORDER BY g.genre_name
            )
            FROM book_genres bg
            JOIN genres g
                ON g.genre_id = bg.genre_id
            WHERE bg.book_id = b.book_id
        ),
        ''
    ) AS genres,

    (
        SELECT COUNT(*)::integer
        FROM book_copies bc
        WHERE bc.book_id = b.book_id
    ) AS total_copies,

    (
        SELECT COUNT(*)::integer
        FROM book_copies bc
        WHERE bc.book_id = b.book_id
          AND bc.status = 'available'
    ) AS available_copies,

    COALESCE(
        (
            SELECT ROUND(AVG(r.rating)::numeric, 2)
            FROM reviews r
            WHERE r.book_id = b.book_id
        ),
        0.00
    ) AS average_rating

FROM books b
LEFT JOIN publishers p
    ON p.publisher_id = b.publisher_id;


CREATE OR REPLACE VIEW vw_active_borrows AS
SELECT
    br.borrow_id,
    br.user_id,
    u.full_name,
    u.username,
    br.copy_id,
    b.book_id,
    b.title,
    b.isbn,
    br.borrow_date,
    br.due_date,
    br.renew_count,

    CASE
        WHEN CURRENT_DATE > br.due_date
        THEN true
        ELSE false
    END AS is_overdue,

    GREATEST(
        CURRENT_DATE - br.due_date,
        0
    ) AS overdue_days

FROM borrows br
JOIN users u
    ON u.user_id = br.user_id
JOIN book_copies bc
    ON bc.copy_id = br.copy_id
JOIN books b
    ON b.book_id = bc.book_id
WHERE br.return_date IS NULL;


CREATE OR REPLACE VIEW vw_user_fine_summary AS
SELECT
    u.user_id,
    u.full_name,
    u.username,

    COUNT(f.fine_id)::integer AS total_fines,

    COALESCE(
        SUM(f.amount)
        FILTER (WHERE f.payment_date IS NULL),
        0
    )::numeric(10, 2) AS unpaid_total,

    COALESCE(
        SUM(f.amount)
        FILTER (WHERE f.payment_date IS NOT NULL),
        0
    )::numeric(10, 2) AS paid_total

FROM users u
LEFT JOIN borrows br
    ON br.user_id = u.user_id
LEFT JOIN fines f
    ON f.borrow_id = br.borrow_id
GROUP BY
    u.user_id,
    u.full_name,
    u.username;


CREATE OR REPLACE VIEW vw_book_statistics AS
SELECT
    b.book_id,
    b.title,
    b.isbn,

    (
        SELECT COUNT(*)::integer
        FROM borrows br
        JOIN book_copies bc
            ON bc.copy_id = br.copy_id
        WHERE bc.book_id = b.book_id
    ) AS borrow_count,

    (
        SELECT COUNT(*)::integer
        FROM reservations r
        WHERE r.book_id = b.book_id
    ) AS reservation_count,

    (
        SELECT COUNT(*)::integer
        FROM reviews rv
        WHERE rv.book_id = b.book_id
    ) AS review_count,

    COALESCE(
        (
            SELECT ROUND(AVG(rv.rating)::numeric, 2)
            FROM reviews rv
            WHERE rv.book_id = b.book_id
        ),
        0.00
    ) AS average_rating

FROM books b;
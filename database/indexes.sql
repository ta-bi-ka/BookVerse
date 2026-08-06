-- BookVerse indexes.sql
-- Implementation will be added in the database phase.
-- BookVerse PostgreSQL Indexes
-- Run this file after schema.sql

BEGIN;

-- Books: improve title search and publisher lookup
CREATE INDEX idx_books_title
    ON books (title);

CREATE INDEX idx_books_publisher_id
    ON books (publisher_id);

-- Junction tables: improve reverse lookups
CREATE INDEX idx_book_authors_author_id
    ON book_authors (author_id);

CREATE INDEX idx_book_genres_genre_id
    ON book_genres (genre_id);

-- Book copies: improve inventory lookup
CREATE INDEX idx_book_copies_book_id
    ON book_copies (book_id);

CREATE INDEX idx_book_copies_status
    ON book_copies (status);

-- Borrowing records
CREATE INDEX idx_borrows_user_id
    ON borrows (user_id);

CREATE INDEX idx_borrows_copy_id
    ON borrows (copy_id);

CREATE INDEX idx_borrows_due_date
    ON borrows (due_date);

CREATE INDEX idx_borrows_return_date
    ON borrows (return_date);

-- Reservations
CREATE INDEX idx_reservations_user_id
    ON reservations (user_id);

CREATE INDEX idx_reservations_book_id
    ON reservations (book_id);

CREATE INDEX idx_reservations_status
    ON reservations (status);

CREATE INDEX idx_reservations_queue
    ON reservations (book_id, status, queue_position);

-- Reviews
CREATE INDEX idx_reviews_book_id
    ON reviews (book_id);

-- Bookshelves
CREATE INDEX idx_bookshelves_user_id
    ON bookshelves (user_id);

CREATE INDEX idx_bookshelf_items_book_id
    ON bookshelf_items (book_id);

-- Logs
CREATE INDEX idx_audit_logs_user_id
    ON audit_logs (user_id);

CREATE INDEX idx_audit_logs_action_time
    ON audit_logs (action_time);

CREATE INDEX idx_procedure_call_logs_user_id
    ON procedure_call_logs (user_id);

CREATE INDEX idx_procedure_call_logs_execution_time
    ON procedure_call_logs (execution_time);

COMMIT;
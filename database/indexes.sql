-- BookVerse performance indexes
-- PostgreSQL automatically creates indexes for primary keys and UNIQUE fields.

CREATE INDEX IF NOT EXISTS idx_users_role_id
ON users (role_id);

CREATE INDEX IF NOT EXISTS idx_books_publisher_id
ON books (publisher_id);

CREATE INDEX IF NOT EXISTS idx_books_title
ON books (title);

CREATE INDEX IF NOT EXISTS idx_books_language
ON books (language);

CREATE INDEX IF NOT EXISTS idx_books_publication_year
ON books (publication_year);

CREATE INDEX IF NOT EXISTS idx_book_authors_author_book
ON book_authors (author_id, book_id);

CREATE INDEX IF NOT EXISTS idx_book_genres_genre_book
ON book_genres (genre_id, book_id);

CREATE INDEX IF NOT EXISTS idx_book_copies_book_status
ON book_copies (book_id, status);

CREATE INDEX IF NOT EXISTS idx_borrows_user_return
ON borrows (user_id, return_date);

CREATE INDEX IF NOT EXISTS idx_borrows_copy_return
ON borrows (copy_id, return_date);

CREATE INDEX IF NOT EXISTS idx_borrows_active_due_date
ON borrows (due_date)
WHERE return_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_user_status
ON reservations (user_id, status);

CREATE INDEX IF NOT EXISTS idx_reservations_book_status
ON reservations (book_id, status);

CREATE INDEX IF NOT EXISTS idx_reviews_book_id
ON reviews (book_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
ON reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_bookshelves_user_id
ON bookshelves (user_id);

CREATE INDEX IF NOT EXISTS idx_bookshelves_public
ON bookshelves (created_on DESC)
WHERE visibility = 'public';

CREATE INDEX IF NOT EXISTS idx_bookshelf_items_book_id
ON bookshelf_items (book_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time
ON audit_logs (user_id, action_time DESC);
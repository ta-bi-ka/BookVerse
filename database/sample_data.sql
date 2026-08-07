-- BookVerse PostgreSQL Sample Data
-- Run this AFTER schema.sql and indexes.sql
-- This file inserts only enough data for development/testing.
--
-- IMPORTANT:
-- Sample users below use placeholder password_hash values.
-- They are NOT intended for login yet.
-- After authentication is implemented, create/update demo users using bcrypt hashes.

BEGIN;

-- =========================================================
-- 1. Roles
-- =========================================================

INSERT INTO roles (role_name, description)
VALUES
    ('Admin', 'Full system administrator'),
    ('Librarian', 'Manages library operations'),
    ('Student', 'Regular library user');

-- =========================================================
-- 2. Users
-- =========================================================

INSERT INTO users (
    role_id,
    full_name,
    username,
    email,
    password_hash,
    phone
)
VALUES
(
    (SELECT role_id FROM roles WHERE role_name = 'Admin'),
    'BookVerse Admin',
    'admin',
    'admin@bookverse.local',
    'TEMP_HASH_REPLACE_AFTER_AUTH_SETUP',
    '01700000001'
),
(
    (SELECT role_id FROM roles WHERE role_name = 'Librarian'),
    'Main Librarian',
    'librarian',
    'librarian@bookverse.local',
    'TEMP_HASH_REPLACE_AFTER_AUTH_SETUP',
    '01700000002'
),
(
    (SELECT role_id FROM roles WHERE role_name = 'Student'),
    'Ayesha Rahman',
    'ayesha',
    'ayesha@student.bookverse.local',
    'TEMP_HASH_REPLACE_AFTER_AUTH_SETUP',
    '01700000003'
),
(
    (SELECT role_id FROM roles WHERE role_name = 'Student'),
    'Nafis Ahmed',
    'nafis',
    'nafis@student.bookverse.local',
    'TEMP_HASH_REPLACE_AFTER_AUTH_SETUP',
    '01700000004'
);

-- =========================================================
-- 3. Publishers
-- =========================================================

INSERT INTO publishers (
    publisher_name,
    country,
    website
)
VALUES
    ('Pearson', 'United Kingdom', 'https://www.pearson.com'),
    ('O''Reilly Media', 'United States', 'https://www.oreilly.com'),
    ('Penguin Books', 'United Kingdom', 'https://www.penguin.co.uk');

-- =========================================================
-- 4. Authors
-- =========================================================

INSERT INTO authors (
    author_name,
    nationality,
    biography
)
VALUES
    ('Abraham Silberschatz', 'American', 'Computer scientist and database textbook author.'),
    ('Henry F. Korth', 'American', 'Computer scientist known for work on database systems.'),
    ('S. Sudarshan', 'Indian', 'Computer scientist and co-author of Database System Concepts.'),
    ('Robert C. Martin', 'American', 'Software engineer and author known for software design books.'),
    ('George Orwell', 'British', 'English novelist and essayist.');

-- =========================================================
-- 5. Genres
-- =========================================================

INSERT INTO genres (
    genre_name,
    description
)
VALUES
    ('Database', 'Books about database systems, SQL and data management.'),
    ('Programming', 'Books about programming and software development.'),
    ('Computer Science', 'General computer science books.'),
    ('Software Engineering', 'Books about software architecture and engineering practices.'),
    ('Fiction', 'Novels and fictional literature.');

-- =========================================================
-- 6. Books
-- =========================================================

INSERT INTO books (
    publisher_id,
    isbn,
    title,
    description,
    language,
    edition,
    publication_year,
    total_pages,
    cover_image
)
VALUES
(
    (SELECT publisher_id FROM publishers WHERE publisher_name = 'Pearson'),
    '9780078022159',
    'Database System Concepts',
    'An introductory and comprehensive textbook on database systems.',
    'English',
    '7th',
    2019,
    1376,
    NULL
),
(
    (SELECT publisher_id FROM publishers WHERE publisher_name = 'Pearson'),
    '9780133970777',
    'Fundamentals of Database Systems',
    'A textbook covering database modeling, design and implementation.',
    'English',
    '7th',
    2015,
    1272,
    NULL
),
(
    (SELECT publisher_id FROM publishers WHERE publisher_name = 'O''Reilly Media'),
    '9781491950357',
    'Designing Data-Intensive Applications',
    'A practical guide to reliable, scalable and maintainable data systems.',
    'English',
    '1st',
    2017,
    616,
    NULL
),
(
    (SELECT publisher_id FROM publishers WHERE publisher_name = 'Pearson'),
    '9780132350884',
    'Clean Code',
    'A practical book about writing readable and maintainable software.',
    'English',
    '1st',
    2008,
    464,
    NULL
),
(
    (SELECT publisher_id FROM publishers WHERE publisher_name = 'O''Reilly Media'),
    '9781449355739',
    'Learning SQL',
    'A beginner-friendly introduction to SQL and relational databases.',
    'English',
    '3rd',
    2020,
    384,
    NULL
),
(
    (SELECT publisher_id FROM publishers WHERE publisher_name = 'Pearson'),
    '9780131103627',
    'The C Programming Language',
    'A classic introduction to the C programming language.',
    'English',
    '2nd',
    1988,
    272,
    NULL
),
(
    (SELECT publisher_id FROM publishers WHERE publisher_name = 'Penguin Books'),
    '9780141036144',
    '1984',
    'A dystopian novel about surveillance, power and freedom.',
    'English',
    '1st',
    1949,
    328,
    NULL
),
(
    (SELECT publisher_id FROM publishers WHERE publisher_name = 'Penguin Books'),
    '9780141036137',
    'Animal Farm',
    'A political allegorical novella.',
    'English',
    '1st',
    1945,
    112,
    NULL
);

-- =========================================================
-- 7. Book-Author Relationships
-- =========================================================

INSERT INTO book_authors (book_id, author_id, author_order)
VALUES
(
    (SELECT book_id FROM books WHERE isbn = '9780078022159'),
    (SELECT author_id FROM authors WHERE author_name = 'Abraham Silberschatz'),
    1
),
(
    (SELECT book_id FROM books WHERE isbn = '9780078022159'),
    (SELECT author_id FROM authors WHERE author_name = 'Henry F. Korth'),
    2
),
(
    (SELECT book_id FROM books WHERE isbn = '9780078022159'),
    (SELECT author_id FROM authors WHERE author_name = 'S. Sudarshan'),
    3
),
(
    (SELECT book_id FROM books WHERE isbn = '9780132350884'),
    (SELECT author_id FROM authors WHERE author_name = 'Robert C. Martin'),
    1
),
(
    (SELECT book_id FROM books WHERE isbn = '9780141036144'),
    (SELECT author_id FROM authors WHERE author_name = 'George Orwell'),
    1
),
(
    (SELECT book_id FROM books WHERE isbn = '9780141036137'),
    (SELECT author_id FROM authors WHERE author_name = 'George Orwell'),
    1
);

-- Note:
-- Some technical demo books above intentionally do not yet have author rows
-- because the approved sample scope requested only five authors.

-- =========================================================
-- 8. Book-Genre Relationships
-- =========================================================

INSERT INTO book_genres (book_id, genre_id)
VALUES
(
    (SELECT book_id FROM books WHERE isbn = '9780078022159'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Database')
),
(
    (SELECT book_id FROM books WHERE isbn = '9780078022159'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Computer Science')
),
(
    (SELECT book_id FROM books WHERE isbn = '9780133970777'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Database')
),
(
    (SELECT book_id FROM books WHERE isbn = '9781491950357'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Computer Science')
),
(
    (SELECT book_id FROM books WHERE isbn = '9781491950357'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Software Engineering')
),
(
    (SELECT book_id FROM books WHERE isbn = '9780132350884'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Software Engineering')
),
(
    (SELECT book_id FROM books WHERE isbn = '9781449355739'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Database')
),
(
    (SELECT book_id FROM books WHERE isbn = '9780131103627'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Programming')
),
(
    (SELECT book_id FROM books WHERE isbn = '9780141036144'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Fiction')
),
(
    (SELECT book_id FROM books WHERE isbn = '9780141036137'),
    (SELECT genre_id FROM genres WHERE genre_name = 'Fiction')
);

-- =========================================================
-- 9. Physical Book Copies
-- =========================================================

INSERT INTO book_copies (
    book_id,
    barcode,
    status,
    condition,
    shelf_location,
    acquisition_date
)
VALUES
(
    (SELECT book_id FROM books WHERE isbn = '9780078022159'),
    'BV-DB-001',
    'available',
    'good',
    'A-01',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9780078022159'),
    'BV-DB-002',
    'available',
    'good',
    'A-01',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9780133970777'),
    'BV-DB-003',
    'available',
    'good',
    'A-02',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9781491950357'),
    'BV-CS-001',
    'available',
    'good',
    'B-01',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9780132350884'),
    'BV-SE-001',
    'available',
    'good',
    'B-02',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9781449355739'),
    'BV-DB-004',
    'available',
    'good',
    'A-03',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9780131103627'),
    'BV-PR-001',
    'available',
    'fair',
    'C-01',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9780141036144'),
    'BV-FI-001',
    'available',
    'good',
    'D-01',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9780141036144'),
    'BV-FI-002',
    'available',
    'good',
    'D-01',
    CURRENT_DATE
),
(
    (SELECT book_id FROM books WHERE isbn = '9780141036137'),
    'BV-FI-003',
    'available',
    'good',
    'D-02',
    CURRENT_DATE
);

-- =========================================================
-- 10. Bookshelves
-- =========================================================

INSERT INTO bookshelves (
    user_id,
    shelf_name,
    description,
    visibility
)
VALUES
(
    (SELECT user_id FROM users WHERE username = 'ayesha'),
    'Favorites',
    'Books I enjoyed the most.',
    'private'
),
(
    (SELECT user_id FROM users WHERE username = 'ayesha'),
    'Want to Read',
    'Books I plan to read.',
    'private'
),
(
    (SELECT user_id FROM users WHERE username = 'nafis'),
    'Currently Reading',
    'Books I am currently reading.',
    'public'
);

-- =========================================================
-- 11. Bookshelf Items
-- =========================================================

INSERT INTO bookshelf_items (
    shelf_id,
    book_id,
    added_date
)
VALUES
(
    (
        SELECT shelf_id
        FROM bookshelves
        WHERE user_id = (SELECT user_id FROM users WHERE username = 'ayesha')
          AND shelf_name = 'Favorites'
    ),
    (SELECT book_id FROM books WHERE isbn = '9780141036144'),
    CURRENT_DATE
),
(
    (
        SELECT shelf_id
        FROM bookshelves
        WHERE user_id = (SELECT user_id FROM users WHERE username = 'ayesha')
          AND shelf_name = 'Want to Read'
    ),
    (SELECT book_id FROM books WHERE isbn = '9781491950357'),
    CURRENT_DATE
),
(
    (
        SELECT shelf_id
        FROM bookshelves
        WHERE user_id = (SELECT user_id FROM users WHERE username = 'nafis')
          AND shelf_name = 'Currently Reading'
    ),
    (SELECT book_id FROM books WHERE isbn = '9780078022159'),
    CURRENT_DATE
);

COMMIT;

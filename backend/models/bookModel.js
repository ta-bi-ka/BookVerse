const { pool } = require("../config/db");

const bookSelectQuery = `
  SELECT
    b.book_id,
    b.publisher_id,
    b.isbn,
    b.title,
    b.description,
    b.language,
    b.edition,
    b.publication_year,
    b.total_pages,
    b.cover_image,
    b.created_on,
    b.last_updated_on,
    json_build_object(
      'publisher_id', p.publisher_id,
      'publisher_name', p.publisher_name,
      'country', p.country,
      'website', p.website,
      'created_on', p.created_on,
      'last_updated_on', p.last_updated_on
    ) AS publisher,
    COALESCE(book_authors.authors, '[]'::json) AS authors,
    COALESCE(book_genres.genres, '[]'::json) AS genres
  FROM books b
  JOIN publishers p ON b.publisher_id = p.publisher_id
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'author_id', a.author_id,
        'author_name', a.author_name,
        'nationality', a.nationality,
        'biography', a.biography,
        'author_order', ba.author_order
      )
      ORDER BY ba.author_order
    ) AS authors
    FROM book_authors ba
    JOIN authors a ON a.author_id = ba.author_id
    WHERE ba.book_id = b.book_id
  ) book_authors ON TRUE
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'genre_id', g.genre_id,
        'genre_name', g.genre_name,
        'description', g.description
      )
      ORDER BY g.genre_id
    ) AS genres
    FROM book_genres bg
    JOIN genres g ON g.genre_id = bg.genre_id
    WHERE bg.book_id = b.book_id
  ) book_genres ON TRUE
`;

const getAllBooks = async () => {
    const result = await pool.query(`
    ${bookSelectQuery}
    ORDER BY b.book_id ASC
  `);

    return result.rows;
};

const getBookById = async (bookId, db = pool) => {
    const result = await db.query(
        `
    ${bookSelectQuery}
    WHERE b.book_id = $1
    `,
        [bookId]
    );

    return result.rows[0];
};

const createBook = async (
    client,
    {
        publisherId,
        isbn,
        title,
        description,
        language,
        edition,
        publicationYear,
        totalPages,
        coverImage,
    }
) => {
    const result = await client.query(
        `
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
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
        [
            publisherId,
            isbn,
            title,
            description || null,
            language || null,
            edition || null,
            publicationYear || null,
            totalPages || null,
            coverImage || null,
        ]
    );

    return result.rows[0];
};

const updateBook = async (
    client,
    bookId,
    {
        publisherId,
        isbn,
        title,
        description,
        language,
        edition,
        publicationYear,
        totalPages,
        coverImage,
    }
) => {
    const result = await client.query(
        `
    UPDATE books
    SET
      publisher_id = $1,
      isbn = $2,
      title = $3,
      description = $4,
      language = $5,
      edition = $6,
      publication_year = $7,
      total_pages = $8,
      cover_image = $9,
      last_updated_on = CURRENT_TIMESTAMP
    WHERE book_id = $10
    RETURNING *
    `,
        [
            publisherId,
            isbn,
            title,
            description || null,
            language || null,
            edition || null,
            publicationYear || null,
            totalPages || null,
            coverImage || null,
            bookId,
        ]
    );

    return result.rows[0];
};

const deleteBook = async (client, bookId) => {
    const result = await client.query(
        `
    DELETE FROM books
    WHERE book_id = $1
    RETURNING *
    `,
        [bookId]
    );

    return result.rows[0];
};

const deleteBookAuthors = async (client, bookId) => {
    await client.query(
        `
    DELETE FROM book_authors
    WHERE book_id = $1
    `,
        [bookId]
    );
};

const deleteBookGenres = async (client, bookId) => {
    await client.query(
        `
    DELETE FROM book_genres
    WHERE book_id = $1
    `,
        [bookId]
    );
};

const createBookAuthor = async (client, bookId, authorId, authorOrder) => {
    await client.query(
        `
    INSERT INTO book_authors (
      book_id,
      author_id,
      author_order
    )
    VALUES ($1, $2, $3)
    `,
        [bookId, authorId, authorOrder]
    );
};

const createBookGenre = async (client, bookId, genreId) => {
    await client.query(
        `
    INSERT INTO book_genres (
      book_id,
      genre_id
    )
    VALUES ($1, $2)
    `,
        [bookId, genreId]
    );
};
const searchBooks = async ({
    q,
    author,
    genre,
    publisher,
    available,
}) => {
    const conditions = [];
    const values = [];
    let index = 1;

    if (q) {
        conditions.push(`
      (
        b.title ILIKE $${index}
        OR b.isbn ILIKE $${index}
      )
    `);
        values.push(`%${q}%`);
        index++;
    }

    if (author) {
        conditions.push(`
      EXISTS (
        SELECT 1
        FROM book_authors ba_search
        JOIN authors a_search
          ON ba_search.author_id = a_search.author_id
        WHERE ba_search.book_id = b.book_id
          AND a_search.author_name ILIKE $${index}
      )
    `);
        values.push(`%${author}%`);
        index++;
    }

    if (genre) {
        conditions.push(`
      EXISTS (
        SELECT 1
        FROM book_genres bg_search
        JOIN genres g_search
          ON bg_search.genre_id = g_search.genre_id
        WHERE bg_search.book_id = b.book_id
          AND g_search.genre_name ILIKE $${index}
      )
    `);
        values.push(`%${genre}%`);
        index++;
    }

    if (publisher) {
        conditions.push(`
      p.publisher_name ILIKE $${index}
    `);
        values.push(`%${publisher}%`);
        index++;
    }

    if (available === "true") {
        conditions.push(`
      EXISTS (
        SELECT 1
        FROM book_copies bc_search
        WHERE bc_search.book_id = b.book_id
          AND bc_search.status = 'available'
      )
    `);
    }

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

    const result = await pool.query(
        `
    SELECT
      b.book_id,
      b.publisher_id,
      b.isbn,
      b.title,
      b.description,
      b.language,
      b.edition,
      b.publication_year,
      b.total_pages,
      b.cover_image,
      b.created_on,
      b.last_updated_on,

      p.publisher_name,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'author_id', a.author_id,
              'author_name', a.author_name,
              'author_order', ba.author_order
            )
            ORDER BY ba.author_order
          )
          FROM book_authors ba
          JOIN authors a
            ON ba.author_id = a.author_id
          WHERE ba.book_id = b.book_id
        ),
        '[]'::json
      ) AS authors,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'genre_id', g.genre_id,
              'genre_name', g.genre_name
            )
            ORDER BY g.genre_name
          )
          FROM book_genres bg
          JOIN genres g
            ON bg.genre_id = g.genre_id
          WHERE bg.book_id = b.book_id
        ),
        '[]'::json
      ) AS genres,

      (
        SELECT COUNT(*)
        FROM book_copies bc
        WHERE bc.book_id = b.book_id
          AND bc.status = 'available'
      )::int AS available_copies

    FROM books b
    LEFT JOIN publishers p
      ON b.publisher_id = p.publisher_id

    ${whereClause}

    ORDER BY b.title ASC
    `,
        values
    );

    return result.rows;
};
module.exports = {
    getAllBooks,
    getBookById,
    searchBooks,
    createBook,
    updateBook,
    deleteBook,
    deleteBookAuthors,
    deleteBookGenres,
    createBookAuthor,
    createBookGenre,
};
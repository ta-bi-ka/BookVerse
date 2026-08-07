const { pool } = require("../config/db");

const bookModel = require("../models/bookModel");

const createBook = async ({
  publisherId,
  isbn,
  title,
  description,
  language,
  edition,
  publicationYear,
  totalPages,
  coverImage,
  authorIds,
  genreIds,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const book = await bookModel.createBook(client, {
      publisherId,
      isbn,
      title,
      description,
      language,
      edition,
      publicationYear,
      totalPages,
      coverImage,
    });

    for (let index = 0; index < authorIds.length; index += 1) {
      await bookModel.createBookAuthor(
        client,
        book.book_id,
        authorIds[index],
        index + 1
      );
    }

    for (let index = 0; index < genreIds.length; index += 1) {
      await bookModel.createBookGenre(client, book.book_id, genreIds[index]);
    }

    await client.query("COMMIT");

    return await bookModel.getBookById(book.book_id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateBook = async (
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
    authorIds,
    genreIds,
  }
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await bookModel.updateBook(client, bookId, {
      publisherId,
      isbn,
      title,
      description,
      language,
      edition,
      publicationYear,
      totalPages,
      coverImage,
    });

    await bookModel.deleteBookAuthors(client, bookId);
    await bookModel.deleteBookGenres(client, bookId);

    for (let index = 0; index < authorIds.length; index += 1) {
      await bookModel.createBookAuthor(
        client,
        bookId,
        authorIds[index],
        index + 1
      );
    }

    for (let index = 0; index < genreIds.length; index += 1) {
      await bookModel.createBookGenre(client, bookId, genreIds[index]);
    }

    await client.query("COMMIT");

    return await bookModel.getBookById(bookId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteBook = async (bookId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await bookModel.deleteBookAuthors(client, bookId);
    await bookModel.deleteBookGenres(client, bookId);

    const deletedBook = await bookModel.deleteBook(client, bookId);

    await client.query("COMMIT");

    return deletedBook;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createBook,
  updateBook,
  deleteBook,
};
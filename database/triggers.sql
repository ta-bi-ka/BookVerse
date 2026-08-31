CREATE OR REPLACE FUNCTION fn_set_last_updated_on()
RETURNS trigger
LANGUAGE plpgsql
AS '
BEGIN
    NEW.last_updated_on = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
';


CREATE OR REPLACE FUNCTION fn_write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
AS '
DECLARE
    v_row_data jsonb;
    v_record_id integer;
    v_user_id integer;
BEGIN
    IF TG_OP = ''DELETE'' THEN
        v_row_data := to_jsonb(OLD);
    ELSE
        v_row_data := to_jsonb(NEW);
    END IF;

    v_record_id =
        (v_row_data ->> TG_ARGV[0])::integer;

    IF TG_NARGS > 1
       AND v_row_data ? TG_ARGV[1] THEN
        v_user_id =
            NULLIF(
                v_row_data ->> TG_ARGV[1],
                ''''
            )::integer;
    ELSE
        v_user_id = NULL;
    END IF;

    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id
    )
    VALUES (
        v_user_id,
        TG_OP,
        TG_TABLE_NAME,
        v_record_id
    );

    IF TG_OP = ''DELETE'' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
';
-- Automatic last_updated_on triggers

DROP TRIGGER IF EXISTS trg_users_updated_on ON users;
CREATE TRIGGER trg_users_updated_on
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_publishers_updated_on ON publishers;
CREATE TRIGGER trg_publishers_updated_on
BEFORE UPDATE ON publishers
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_authors_updated_on ON authors;
CREATE TRIGGER trg_authors_updated_on
BEFORE UPDATE ON authors
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_genres_updated_on ON genres;
CREATE TRIGGER trg_genres_updated_on
BEFORE UPDATE ON genres
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_books_updated_on ON books;
CREATE TRIGGER trg_books_updated_on
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_book_copies_updated_on ON book_copies;
CREATE TRIGGER trg_book_copies_updated_on
BEFORE UPDATE ON book_copies
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_borrows_updated_on ON borrows;
CREATE TRIGGER trg_borrows_updated_on
BEFORE UPDATE ON borrows
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_reservations_updated_on ON reservations;
CREATE TRIGGER trg_reservations_updated_on
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_fines_updated_on ON fines;
CREATE TRIGGER trg_fines_updated_on
BEFORE UPDATE ON fines
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_reviews_updated_on ON reviews;
CREATE TRIGGER trg_reviews_updated_on
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();

DROP TRIGGER IF EXISTS trg_bookshelves_updated_on ON bookshelves;
CREATE TRIGGER trg_bookshelves_updated_on
BEFORE UPDATE ON bookshelves
FOR EACH ROW
EXECUTE FUNCTION fn_set_last_updated_on();


-- Audit-log triggers

DROP TRIGGER IF EXISTS trg_users_audit ON users;
CREATE TRIGGER trg_users_audit
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION fn_write_audit_log(
    'user_id',
    'user_id'
);

DROP TRIGGER IF EXISTS trg_books_audit ON books;
CREATE TRIGGER trg_books_audit
AFTER INSERT OR UPDATE OR DELETE ON books
FOR EACH ROW
EXECUTE FUNCTION fn_write_audit_log(
    'book_id'
);

DROP TRIGGER IF EXISTS trg_book_copies_audit ON book_copies;
CREATE TRIGGER trg_book_copies_audit
AFTER INSERT OR UPDATE OR DELETE ON book_copies
FOR EACH ROW
EXECUTE FUNCTION fn_write_audit_log(
    'copy_id'
);

DROP TRIGGER IF EXISTS trg_borrows_audit ON borrows;
CREATE TRIGGER trg_borrows_audit
AFTER INSERT OR UPDATE OR DELETE ON borrows
FOR EACH ROW
EXECUTE FUNCTION fn_write_audit_log(
    'borrow_id',
    'user_id'
);

DROP TRIGGER IF EXISTS trg_reservations_audit ON reservations;
CREATE TRIGGER trg_reservations_audit
AFTER INSERT OR UPDATE OR DELETE ON reservations
FOR EACH ROW
EXECUTE FUNCTION fn_write_audit_log(
    'reservation_id',
    'user_id'
);

DROP TRIGGER IF EXISTS trg_fines_audit ON fines;
CREATE TRIGGER trg_fines_audit
AFTER INSERT OR UPDATE OR DELETE ON fines
FOR EACH ROW
EXECUTE FUNCTION fn_write_audit_log(
    'fine_id'
);

DROP TRIGGER IF EXISTS trg_reviews_audit ON reviews;
CREATE TRIGGER trg_reviews_audit
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_write_audit_log(
    'review_id',
    'user_id'
);

DROP TRIGGER IF EXISTS trg_bookshelves_audit ON bookshelves;
CREATE TRIGGER trg_bookshelves_audit
AFTER INSERT OR UPDATE OR DELETE ON bookshelves
FOR EACH ROW
EXECUTE FUNCTION fn_write_audit_log(
    'shelf_id',
    'user_id'
);
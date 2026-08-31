-- BookVerse functions and stored procedures

CREATE OR REPLACE FUNCTION fn_calculate_overdue_fine(
    p_due_date date,
    p_effective_date date,
    p_daily_rate numeric
)
RETURNS numeric(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_overdue_days integer;
BEGIN
    IF p_due_date IS NULL OR p_effective_date IS NULL THEN
        RAISE EXCEPTION 'Due date and effective date are required';
    END IF;

    IF p_daily_rate IS NULL OR p_daily_rate < 0 THEN
        RAISE EXCEPTION 'Daily fine rate cannot be negative';
    END IF;

    v_overdue_days :=
        GREATEST(p_effective_date - p_due_date, 0);

    RETURN ROUND(
        (v_overdue_days * p_daily_rate)::numeric,
        2
    );
END;
$$;


CREATE OR REPLACE FUNCTION fn_get_available_copy(
    p_book_id integer
)
RETURNS integer
LANGUAGE sql
AS $$
    SELECT copy_id
    FROM book_copies
    WHERE book_id = p_book_id
      AND status = 'available'
    ORDER BY copy_id
    LIMIT 1;
$$;


CREATE OR REPLACE PROCEDURE sp_create_overdue_fine(
    p_borrow_id integer,
    p_daily_rate numeric,
    p_staff_user_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_due_date date;
    v_effective_date date;
    v_overdue_days integer;
    v_amount numeric(10, 2);
BEGIN
    SELECT
        due_date,
        COALESCE(return_date, CURRENT_DATE)
    INTO
        v_due_date,
        v_effective_date
    FROM borrows
    WHERE borrow_id = p_borrow_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Borrow record % does not exist',
            p_borrow_id;
    END IF;

    v_overdue_days :=
        GREATEST(v_effective_date - v_due_date, 0);

    IF v_overdue_days = 0 THEN
        RAISE EXCEPTION
            'Borrow record % is not overdue',
            p_borrow_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM fines
        WHERE borrow_id = p_borrow_id
    ) THEN
        RAISE EXCEPTION
            'A fine already exists for borrow record %',
            p_borrow_id;
    END IF;

    v_amount := fn_calculate_overdue_fine(
        v_due_date,
        v_effective_date,
        p_daily_rate
    );

    INSERT INTO fines (
        borrow_id,
        amount,
        reason
    )
    VALUES (
        p_borrow_id,
        v_amount,
        FORMAT(
            'Late return: %s overdue day(s)',
            v_overdue_days
        )
    );

    INSERT INTO procedure_call_logs (
        user_id,
        procedure_name,
        status
    )
    VALUES (
        p_staff_user_id,
        'sp_create_overdue_fine',
        'success'
    );
END;
$$;


CREATE OR REPLACE PROCEDURE sp_mark_fine_paid(
    p_fine_id integer,
    p_staff_user_id integer,
    p_payment_date date DEFAULT CURRENT_DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_updated_rows integer;
BEGIN
    UPDATE fines
    SET
        payment_date = p_payment_date,
        last_updated_on = CURRENT_TIMESTAMP
    WHERE fine_id = p_fine_id;

    GET DIAGNOSTICS
        v_updated_rows = ROW_COUNT;

    IF v_updated_rows = 0 THEN
        RAISE EXCEPTION
            'Fine record % does not exist',
            p_fine_id;
    END IF;

    INSERT INTO procedure_call_logs (
        user_id,
        procedure_name,
        status
    )
    VALUES (
        p_staff_user_id,
        'sp_mark_fine_paid',
        'success'
    );
END;
$$;


-- Example read-only tests:
-- SELECT fn_calculate_overdue_fine(
--     CURRENT_DATE - 5,
--     CURRENT_DATE,
--     10
-- );
--
-- SELECT fn_get_available_copy(1);
--
-- Mutating procedures should be called only with valid records:
-- CALL sp_create_overdue_fine(1, 10, 4);
-- CALL sp_mark_fine_paid(1, 4);
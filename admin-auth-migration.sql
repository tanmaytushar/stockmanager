-- Adds administrator authentication without changing existing application data.
-- Run this file against an existing Stock Manager Oracle schema.

DECLARE
    TABLE_COUNT NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO TABLE_COUNT
    FROM USER_TABLES
    WHERE TABLE_NAME = 'ADMIN_CREDENTIAL';

    IF TABLE_COUNT = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE ADMIN_CREDENTIAL (
                USERNAME VARCHAR2(50) PRIMARY KEY,
                PASSWORD_HASH VARCHAR2(100) NOT NULL
            )';
    END IF;
END;
/

-- Initial local admin login: admin / Admin@123
-- Change this credential before using the application outside local development.
MERGE INTO ADMIN_CREDENTIAL TARGET
USING (
    SELECT
        'admin' AS USERNAME,
        '$2a$12$4vGGRn.vpMn6HdCKJ/TDSu7N5FSmH0ib.8A8cq6rCDXQhNp7vZSo6' AS PASSWORD_HASH
    FROM DUAL
) SOURCE
ON (TARGET.USERNAME = SOURCE.USERNAME)
WHEN NOT MATCHED THEN
    INSERT (USERNAME, PASSWORD_HASH)
    VALUES (SOURCE.USERNAME, SOURCE.PASSWORD_HASH);

COMMIT;

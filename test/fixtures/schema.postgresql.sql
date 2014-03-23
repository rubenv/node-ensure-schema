DROP TABLE IF EXISTS test;

CREATE TABLE test (
    id integer NOT NULL PRIMARY KEY,
    name text,
    value integer DEFAULT 1
);

CREATE INDEX testname ON test USING btree (name);

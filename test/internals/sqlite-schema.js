var assert = require('assert');
var sqlite3 = require('sqlite3').verbose();
var sqliteMapper = require('../../lib/sqlite3');

describe('SQLite schemas', function () {
    it('has extractSchema', function () {
        assert.notEqual(sqliteMapper.extractSchema, undefined);
    });

    it('Should read SQLite schema', function (done) {
        var db = new sqlite3.Database(__dirname + '/../fixtures/schema.sqlite3');

        sqliteMapper.extractSchema(db, function (err, schema) {
            assert.notEqual(schema, undefined);
            assert.notEqual(schema.tables, undefined);
            assert.notEqual(schema.tables.test.fields, undefined);

            assert.deepEqual(schema.tables.test.fields.id, {
                type: 'INTEGER',
                options: {
                    primary: true
                }
            });
            assert.deepEqual(schema.tables.test.fields.name, {
                type: 'TEXT',
                options: {
                    primary: false
                }
            });
            done(err);
        });
    });
});

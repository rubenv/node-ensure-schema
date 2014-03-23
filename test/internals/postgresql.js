var assert = require('assert');
var fs = require('fs');
var pg = require('pg').native;
var postgresMapper = require('../../lib/postgresql');

describe('PostgreSQL schemas', function () {
    var db = null;

    beforeEach(function (done) {
        db = new pg.Client("postgres://test@localhost/test");
        db.connect(function (err) {
            if (err) {
                return done(err);
            }

            var query = fs.readFileSync(__dirname + "/../fixtures/schema.postgresql.sql", "utf8");
            db.query(query, done);
        });
    });

    it('has extractSchema', function () {
        assert.notEqual(postgresMapper.extractSchema, undefined);
    });

    it('Should read PostgreSQL schema', function (done) {
        postgresMapper.extractSchema(db, function (err, schema) {
            assert.notEqual(schema, undefined);
            assert.notEqual(schema.tables, undefined);
            assert.notEqual(schema.tables.test.fields, undefined);

            assert.deepEqual(schema.tables.test.fields.id, {
                type: 'integer',
                options: {
                    primary: true
                }
            });
            assert.deepEqual(schema.tables.test.fields.name, {
                type: 'text',
                options: {
                    primary: false
                }
            });
            assert.deepEqual(schema.tables.test.fields.value, {
                type: 'integer',
                options: {
                    primary: false,
                    default: 1
                }
            });

            assert.notEqual(schema.tables.test.indexes, undefined);
            assert.deepEqual(schema.tables.test.indexes.testname, {
                unique: false,
                fields: ['name']
            });

            done(err);
        });
    });
});

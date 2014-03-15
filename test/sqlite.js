var assert = require('assert');
var sqlite3 = require('sqlite3').verbose();
var ensureSchema = require('..');

var sqliteMapper = require('../lib/sqlite3');

function testSchema(db, schema, cb) {
    ensureSchema('sqlite3', db, schema, function (err) {
        if (err) {
            return cb(err);
        }

        sqliteMapper.extractSchema(db, cb);
    });
}

describe('SQLite', function () {
    var db;

    beforeEach(function () {
        db = new sqlite3.Database(':memory:');
    });

    it('Creates tables', function (done) {
        var schema = function () {
            this.table("people", function () {
                this.field('id', 'INTEGER', { primary: true });
            });
        };

        testSchema(db, schema, function (err, schema) {
            if (err) {
                return done(err);
            }

            assert.deepEqual(schema.tables.people.id, {
                type: 'INTEGER',
                options: { primary: true }
            });

            done(); 
        });
    });

    it('Creates tables with multiple columns', function (done) {
        var schema = function () {
            this.table("people", function () {
                this.field('id', 'INTEGER', { primary: true });
                this.field('name', 'TEXT');
            });
        };

        testSchema(db, schema, function (err, schema) {
            if (err) {
                return done(err);
            }

            assert.deepEqual(schema.tables.people.id, {
                type: 'INTEGER',
                options: { primary: true }
            });
            assert.deepEqual(schema.tables.people.name, {
                type: 'TEXT',
                options: { primary: false }
            });

            done(); 
        });
    });

    it('Can add columns');
});

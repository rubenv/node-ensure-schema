var async = require('async');
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

            assert.deepEqual(schema.tables.people.fields.id, {
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

            assert.deepEqual(schema.tables.people.fields.id, {
                type: 'INTEGER',
                options: { primary: true }
            });
            assert.deepEqual(schema.tables.people.fields.name, {
                type: 'TEXT',
                options: { primary: false }
            });

            done(); 
        });
    });

    it('Can add columns', function (done) {
        async.series([
            function (cb) {
                var schema = function () {
                    this.table("people", function () {
                        this.field('id', 'INTEGER', { primary: true });
                    });
                };

                testSchema(db, schema, function (err, schema) {
                    if (err) {
                        return cb(err);
                    }

                    assert.deepEqual(schema.tables.people.fields.id, {
                        type: 'INTEGER',
                        options: { primary: true }
                    });
                    assert.equal(schema.tables.people.fields.name, undefined);

                    cb(); 
                });
            },
            function (cb) {
                var schema = function () {
                    this.table("people", function () {
                        this.field('id', 'INTEGER', { primary: true });
                        this.field('name', 'TEXT');
                    });
                };

                testSchema(db, schema, function (err, schema) {
                    if (err) {
                        return cb(err);
                    }

                    assert.deepEqual(schema.tables.people.fields.id, {
                        type: 'INTEGER',
                        options: { primary: true }
                    });
                    assert.deepEqual(schema.tables.people.fields.name, {
                        type: 'TEXT',
                        options: { primary: false }
                    });

                    cb(); 
                });
            }
        ], done);
    });
});

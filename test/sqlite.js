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
        //db.on('trace', function (query) { console.log(query); });
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

    it('Creates tables with multiple columns and index', function (done) {
        var schema = function () {
            this.table("people", function () {
                this.field('id', 'INTEGER', { primary: true });
                this.field('name', 'TEXT');

                this.index('nameIdx', ['name']);
                this.index('nameIdxUnique', ['name'], true);
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

            assert.deepEqual(schema.tables.people.indexes.nameIdx, {
                unique: false,
                fields: ['name']
            });

            assert.deepEqual(schema.tables.people.indexes.nameIdxUnique, {
                unique: true,
                fields: ['name']
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
                        this.field('value', 'INTEGER', { default: 3 });
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
                    assert.deepEqual(schema.tables.people.fields.value, {
                        type: 'INTEGER',
                        options: { primary: false, default: 3 }
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

    it('Can modify indexes', function (done) {
        async.series([
            function (cb) {
                var schema = function () {
                    this.table("people", function () {
                        this.field('id', 'INTEGER', { primary: true });
                        this.field('name', 'TEXT');
                            
                        this.index('nameIdx', ['name']);
                    });
                };

                testSchema(db, schema, function (err, schema) {
                    if (err) {
                        return cb(err);
                    }

                    assert.deepEqual(schema.tables.people.indexes.nameIdx, {
                        unique: false,
                        fields: ['name']
                    });

                    cb(); 
                });
            },
            function (cb) {
                var schema = function () {
                    this.table("people", function () {
                        this.field('id', 'INTEGER', { primary: true });
                        this.field('name', 'TEXT');
                            
                        this.index('nameIdx', ['name', 'id'], true);
                    });
                };

                testSchema(db, schema, function (err, schema) {
                    if (err) {
                        return cb(err);
                    }

                    assert.deepEqual(schema.tables.people.indexes.nameIdx, {
                        unique: true,
                        fields: ['name', 'id']
                    });

                    cb(); 
                });
            }
        ], done);
    });

    it('Can supply multiple schemas', function (done) {
        var schema = function () {
            this.table("people", function () {
                this.field('id', 'INTEGER', { primary: true });
            });
        };

        var schema2 = function () {
            this.table("animals", function () {
                this.field('id', 'INTEGER', { primary: true });
            });
        };

        testSchema(db, [schema, schema2], function (err, schema) {
            if (err) {
                return done(err);
            }

            assert.deepEqual(schema.tables.people.fields.id, {
                type: 'INTEGER',
                options: { primary: true }
            });
            assert.deepEqual(schema.tables.animals.fields.id, {
                type: 'INTEGER',
                options: { primary: true }
            });

            done(); 
        });
    });
});

var async = require('async');
var assert = require('assert');
var pg = require('pg').native;
var ensureSchema = require('..');

var postgresMapper = require('../lib/postgresql');

function testSchema(db, schema, cb) {
    ensureSchema('postgresql', db, schema, function (err) {
        if (err) {
            return cb(err);
        }

        postgresMapper.extractSchema(db, cb);
    });
}

describe('PostgreSQL', function () {
    var db;

    beforeEach(function (done) {
        db = new pg.Client("postgres://test@localhost/test");
        /*
        var origQuery = db.query;
        db.query = function () {
            console.log(arguments);
            origQuery.apply(this, arguments);
        };
        */
        db.connect(function (err) {
            if (err) {
                return done(err);
            }

            postgresMapper.extractSchema(db, function (err, schema) {
                if (err) {
                    return done(err);
                }

                var tables = Object.keys(schema.tables);

                function dropTable(table, cb) {
                    db.query("DROP TABLE " + table, cb);
                }

                async.each(tables, dropTable, done);
            });
        });
    });

    it('Creates tables', function (done) {
        var schema = function () {
            this.table("people", function () {
                this.field('id', 'integer', { primary: true });
            });
        };

        testSchema(db, schema, function (err, schema) {
            if (err) {
                return done(err);
            }

            assert.deepEqual(schema.tables.people.fields.id, {
                type: 'integer',
                options: { primary: true }
            });

            done(); 
        });
    });

    it('Creates tables with multiple columns and index', function (done) {
        var schema = function () {
            this.table("people", function () {
                this.field('id', 'integer', { primary: true });
                this.field('name', 'text');

                this.index('nameidx', ['name']);
                this.index('nameidxunique', ['name'], true);
            });
        };

        testSchema(db, schema, function (err, schema) {
            if (err) {
                return done(err);
            }

            assert.deepEqual(schema.tables.people.fields.id, {
                type: 'integer',
                options: { primary: true }
            });
            assert.deepEqual(schema.tables.people.fields.name, {
                type: 'text',
                options: { primary: false }
            });

            assert.deepEqual(schema.tables.people.indexes.nameidx, {
                unique: false,
                fields: ['name']
            });

            assert.deepEqual(schema.tables.people.indexes.nameidxunique, {
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
                        this.field('id', 'integer', { primary: true });
                        this.field('value', 'integer', { default: 3 });
                    });
                };

                testSchema(db, schema, function (err, schema) {
                    if (err) {
                        return cb(err);
                    }

                    assert.deepEqual(schema.tables.people.fields.id, {
                        type: 'integer',
                        options: { primary: true }
                    });
                    assert.deepEqual(schema.tables.people.fields.value, {
                        type: 'integer',
                        options: { primary: false, default: 3 }
                    });
                    assert.equal(schema.tables.people.fields.name, undefined);

                    cb(); 
                });
            },
            function (cb) {
                var schema = function () {
                    this.table("people", function () {
                        this.field('id', 'integer', { primary: true });
                        this.field('name', 'text');
                    });
                };

                testSchema(db, schema, function (err, schema) {
                    if (err) {
                        return cb(err);
                    }

                    assert.deepEqual(schema.tables.people.fields.id, {
                        type: 'integer',
                        options: { primary: true }
                    });
                    assert.deepEqual(schema.tables.people.fields.name, {
                        type: 'text',
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
                        this.field('id', 'integer', { primary: true });
                        this.field('name', 'text');
                            
                        this.index('nameidx', ['name']);
                    });
                };

                testSchema(db, schema, function (err, schema) {
                    if (err) {
                        return cb(err);
                    }

                    assert.deepEqual(schema.tables.people.indexes.nameidx, {
                        unique: false,
                        fields: ['name']
                    });

                    cb(); 
                });
            },
            function (cb) {
                var schema = function () {
                    this.table("people", function () {
                        this.field('id', 'integer', { primary: true });
                        this.field('name', 'text');
                            
                        this.index('nameidx', ['id', 'name'], true);
                    });
                };

                testSchema(db, schema, function (err, schema) {
                    if (err) {
                        return cb(err);
                    }

                    assert.deepEqual(schema.tables.people.indexes.nameidx, {
                        unique: true,
                        fields: ['id', 'name']
                    });

                    cb(); 
                });
            }
        ], done);
    });
});

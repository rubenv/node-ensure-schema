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
        db.connect(done);
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
});

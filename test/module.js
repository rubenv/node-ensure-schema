var assert = require('assert');
var ensureSchema = require('..');

describe('Module', function () {
    it('Has function', function () {
        assert.notEqual(ensureSchema, undefined);
        assert.equal(ensureSchema.length, 4);
    });
});

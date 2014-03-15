var async = require('async');

var TableMapper = (function () {
    function TableMapper(mapper, name, def) {
        this._mapper = mapper;
        this._isNew = !mapper.schema.tables[name];
        this._fields = [];
        this._tableSchema = mapper.schema.tables[name];
        this._name = name;

        def.apply(this);

        if (this._isNew) {
            mapper._createTable(name, this._fields);
        }
    }

    TableMapper.prototype.field = function (name, type, options) {
        var fieldDef = {
            name: name,
            type: type,
            options: options
        };

        if (this._isNew) {
            this._fields.push(fieldDef);
        } else if (this._tableSchema[name]) {
            // TODO: Check if equal 
            throw new Error("Can't update yet!");
        } else {
            this._mapper._createField(this._name, fieldDef);
        }
    };

    return TableMapper;
})();

var Mapper = (function () {
    function Mapper(backend, db, schemaDef, cb) {
        var self = this;

        this.backend = backend;
        this.db = db;
        this.cb = cb;
        
        this._queue = [];

        function haveTask() {
            return self._queue.length > 0;
        }

        backend.extractSchema(db, function (err, schema) {
            self.schema = schema;

            try {
                schemaDef.apply(self);
            } catch (e) {
                return cb(e);
            }

            async.whilst(haveTask, function (cb) {
                self._queue.shift()(cb);
            }, cb);
        });
    }

    Mapper.prototype.table = function (name, def) {
        new TableMapper(this, name, def);
    };

    Mapper.prototype._createTable = function (name, fields) {
        var self = this;

        this._queue.push(function (cb) {
            self.backend.createTable(self.db, name, fields, cb);  
        });
    };

    return Mapper;
})();

module.exports = Mapper;

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

    function needsUpdate(current, desired) {
        if (current.type !== desired.type) {
            return true; 
        }

        var key;
        for (key in current.options) {
            if (current.options[key] !== desired.options[key]) {
                return true;
            }
        }

        return false;
    }

    TableMapper.prototype.field = function (name, type, options) {
        var fieldDef = {
            name: name,
            type: type,
            options: options || {}
        };

        if (this._isNew) {
            this._fields.push(fieldDef);
        } else if (this._tableSchema.fields[name]) {
            if (needsUpdate(this._tableSchema.fields[name], fieldDef)) {
                throw new Error("Cannot alter fields in SQLite3!");
                //this._mapper._alterField(this._name, fieldDef);
            }
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

    Mapper.prototype._createField = function (table, fieldDef) {
        var self = this;
        this._queue.push(function (cb) {
            self.backend.createField(self.db, table, fieldDef, cb);  
        });
    };

    return Mapper;
})();

module.exports = Mapper;

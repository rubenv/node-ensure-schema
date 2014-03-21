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

    function fieldNeedsUpdate(current, desired) {
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

    function indexNeedsUpdate(current, desired) {
        if (current.fields.length !== desired.fields.length) {
            return true;
        }
        for (var i = 0; i < current.fields.length; i++) {
            if (current.fields[i] !== desired.fields[i]) {
                return true;
            }
        }

        if (current.unique !== desired.unique) {
            return true;
        }

        return false;
    }

    TableMapper.prototype.field = function (name, type, options) {
        var fieldDef = {
            name: name,
            type: type,
            options: options || {
                primary: false
            }
        };

        if (this._isNew) {
            this._fields.push(fieldDef);
        } else if (this._tableSchema.fields[name]) {
            if (fieldNeedsUpdate(this._tableSchema.fields[name], fieldDef)) {
                throw new Error("Cannot alter fields in SQLite3!");
                //this._mapper._alterField(this._name, fieldDef);
            }
        } else {
            this._mapper._createField(this._name, fieldDef);
        }
    };

    TableMapper.prototype.index = function (name, fields, unique) {
        var indexDef = {
            name: name,
            fields: fields,
            unique: !!unique
        };

        var create = false;
        var current = this._tableSchema ? this._tableSchema.indexes[name] : null;

        if (!current) {
            create = true;
        } else if (indexNeedsUpdate(current, indexDef)) {
            create = true;
            this._mapper._dropIndex(this._name, name);
        }

        if (create) {
            this._mapper._createIndex(this._name, indexDef);
        }
    };

    return TableMapper;
})();

var Mapper = (function () {
    function Mapper(backend, db, schemaDef, cb) {
        var self = this;

        if (!cb) {
            throw new Error("Missing callback parameter!");
        }

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
        this._queue.unshift(function (cb) {
            self.backend.createTable(self.db, name, fields, cb);  
        });
    };

    Mapper.prototype._createField = function (table, fieldDef) {
        var self = this;
        this._queue.push(function (cb) {
            self.backend.createField(self.db, table, fieldDef, cb);  
        });
    };

    Mapper.prototype._createIndex = function (table, indexDef) {
        var self = this;
        this._queue.push(function (cb) {
            self.backend.createIndex(self.db, table, indexDef, cb);  
        });
    };

    Mapper.prototype._dropIndex = function (table, name) {
        var self = this;
        this._queue.push(function (cb) {
            self.backend.dropIndex(self.db, table, name, cb);  
        });
    };

    return Mapper;
})();

module.exports = Mapper;

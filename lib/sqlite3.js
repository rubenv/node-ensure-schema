var async = require('async');

function extractSchema(db, cb) {
    var schema = {
        tables: {}
    };

    function extractTableSchema(table, cb) {
        var tableDef = schema.tables[table.name] = {
            fields: {},
            indexes: {}
        };

        async.parallel({
            table_info: function (cb) {
                db.all("PRAGMA table_info(" + table.name + ")", function (err, columns) {
                    if (err) {
                        return cb(err);
                    }

                    for (var i = 0; i < columns.length; i++) {
                        var column = columns[i];
                        var options = {
                            primary: column.pk === 1
                        };

                        if (column.dflt_value !== null) {
                            options.default = column.dflt_value;
                        }

                        tableDef.fields[column.name] = {
                            type: column.type,
                            options: options
                        };
                    }

                    cb();
                });
            },
            indexes: function (cb) {
                db.all("PRAGMA index_list(" + table.name + ")", function (err, indexes) {
                    if (err) {
                        return cb(err);
                    }

                    function extractIndex(index, cb) {
                        tableDef.indexes[index.name] = {
                            unique: index.unique === 1,
                            fields: []
                        };

                        db.all("PRAGMA index_info(" + index.name + ")", function (err, fields) {
                            if (err) {
                                return cb(err);
                            }

                            tableDef.indexes[index.name].fields = fields.map(function (field) {
                                return field.name;
                            });

                            cb();
                        });
                    }

                    async.each(indexes, extractIndex, cb);
                });
            }
        }, cb);

    }

    db.all("SELECT * FROM sqlite_master WHERE type='table'", function (err, tables) {
        if (err) {
            return cb(err);
        }

        async.each(tables, extractTableSchema, function (err) {
            return cb(err, schema);
        });
    });
}

function fieldSql(field) {
    var sql = field.name + " " + field.type;
    if (field.options) {
        if (field.options.primary) {
            sql += " PRIMARY KEY";
        }
        if (field.options.default !== undefined) {
            sql += " DEFAULT ";
            if (typeof field.options.default === 'number') {
                sql += field.options.default;
            } else {
                throw new Error("Non-numeric defaults not supported yet!");
            }
        }
    }
    return sql;
}

function createTable(db, name, fields, cb) {
    var fieldDefs = [];
    for (var i = 0; i < fields.length; i++) {
        fieldDefs.push(fieldSql(fields[i]));
    }

    var sql = "CREATE TABLE " + name + " (" + fieldDefs.join(", ") + ")";
    db.run(sql, cb);
}

function createField(db, table, fieldDef, cb) {
    var sql = "ALTER TABLE " + table + " ADD COLUMN " + fieldSql(fieldDef);
    db.run(sql, cb);
}

function alterField(db, table, fieldDef, cb) {
    cb(new Error("Cannot alter fields in SQLite3!"));
}

function createIndex(db, table, indexDef, cb) {
    var sql = "CREATE " + (indexDef.unique ? "UNIQUE " : "") + "INDEX " + indexDef.name + " ON " + table + " (";
    sql += indexDef.fields.join(", ");
    sql += ")";
    db.run(sql, cb);
}

function dropIndex(db, table, name, cb) {
    var sql = "DROP INDEX " + name;
    db.run(sql, cb);
}

module.exports = {
    alterField: alterField,
    createField: createField,
    createIndex: createIndex,
    createTable: createTable,
    dropIndex: dropIndex,
    extractSchema: extractSchema,
};

var async = require('async');

function extractSchema(db, cb) {
    var schema = {
        tables: {}
    };

    function extractTableSchema(table, cb) {
        var tableDef = schema.tables[table.name] = {
            fields: {}
        };

        db.all("PRAGMA table_info(" + table.name + ")", function (err, columns) {
            if (err) {
                return cb(err);
            }

            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];
                tableDef[column.name] = {
                    type: column.type,
                    options: {
                        primary: column.pk === 1
                    }
                };
            }

            cb();
        });
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

module.exports = {
    extractSchema: extractSchema,
    createTable: createTable,
    createField: createField
};

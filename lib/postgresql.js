var async = require('async');

function extractSchema(db, cb) {
    var schema = {
        tables: {}
    };

    function extractTableSchema(table, cb) {
        var tableDef = schema.tables[table.tablename] = {
            fields: {},
            indexes: {}
        };

        async.parallel({
            table_info: function (cb) {
                var column_query = "SELECT " +
                    "    attname as name, " +
                    "    format_type(atttypid, atttypmod) AS type, " +
                    "    indisprimary AS isprimary, " +
                    "    adsrc AS default_value " +
                    "FROM pg_attribute " +
                    "LEFT JOIN pg_attrdef ON (adrelid=attrelid AND attnum=adnum) " +
                    "LEFT JOIN pg_index ON (attnum=any(pg_index.indkey) AND indrelid=attrelid) " +
                    "JOIN pg_class ON (oid=attrelid) WHERE relname=$1 AND attnum>0";

                db.query(column_query, [table.tablename], function (err, columns) {
                    if (err) {
                        return cb(err);
                    }

                    for (var i = 0; i < columns.rows.length; i++) {
                        var column = columns.rows[i];
                        var options = {
                            primary: column.isprimary === true
                        };

                        if (column.default_value !== null) {
                            options.default = column.default_value;
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
                var index_query = "SELECT " +
                    "    i.relname AS index_name, " +
                    "    array_to_string(array_agg(a.attname), ',') AS column_names " +
                    "FROM pg_class t, pg_class i, pg_index ix, pg_attribute a " +
                    "WHERE t.oid = ix.indrelid " +
                    "AND i.oid = ix.indexrelid " +
                    "AND NOT ix.indisprimary " +
                    "AND a.attrelid = t.oid " +
                    "AND a.attnum = ANY(ix.indkey) " +
                    "AND t.relkind = 'r' " +
                    "AND t.relname=$1 " +
                    "GROUP BY i.relname "  +
                    "ORDER BY i.relname";

                db.query(index_query, [table.tablename], function (err, indexes) {
                    if (err) {
                        return cb(err);
                    }

                    for (var i = 0; i < indexes.rows.length; i++) {
                        var index = indexes.rows[i];
                        tableDef.indexes[index.index_name] = {
                            unique: index.unique === 1,
                            fields: index.column_names.split(',')
                        };
                    }

                    cb();
                });
            }
        }, cb);
    }

    db.query("SELECT tablename FROM pg_tables WHERE schemaname='public'", function (err, tables) {
        if (err) {
            return cb(err);
        }

        async.each(tables.rows, extractTableSchema, function (err) {
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
    db.query(sql, cb);
}

module.exports = {
    extractSchema: extractSchema,
    createTable: createTable,
};

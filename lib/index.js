var Mapper = require('./mapper');

var backends = {
    postgresql: require('./postgresql'),
    sqlite3: require('./sqlite3'),
};

module.exports = function (type, db, schemaDef, cb) {
    if (!backends[type]) {
        return cb(new Error("Unknown db type: " + type));
    }

    var backend = backends[type];
    new Mapper(backend, db, schemaDef, cb);
};

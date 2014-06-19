/**
   Module responsible for database handling and execution.
   
   @author Maciej Reichwald
 */

var sqlite3 = require("sqlite3");
var fs = require('fs');
var dbMsgHandler = require('./dbMsgHandler');
var DATABASE_PATH = "./assets/db/mobshareDB.db";

function init(response, path) {
    var db = new sqlite3.Database(DATABASE_PATH, function() {
        fs.readFile(path, function(err, data) {
            if(err) {
                console.error("Could not open file: %s", err);
                return;
            }

            var query = data.toString('utf8');
            var queries = query.split(";");

            db.serialize(function() {
                var query_count = queries.length;
                for(var i = 0; i < queries.length; i++) {
                    queries[i] = queries[i].replace("\r\n", "");
                    //var dbHandler = new dbMsgHandler.DBMsgHandler(queries[i], );
                    db.run(queries[i], function(error) {
                        if(error) {
                            console.log("Query error: "+error);
                        }

                        query_count--;

                        if(query_count <= 0) {
                            db.close();
                            listAllTables(response);
                        }
                    });
                }
            });
        });
    });
}

function listAllTables(response) {
    runQuery("SELECT name FROM sqlite_master WHERE type = 'table'", function(error,records) {
        var selectQuery = "";
        var writeArray = {};
        for(var record_id=0; record_id<records.length; record_id++) {
            var tableProps = records[record_id];
            writeArray[record_id] = tableProps;
            selectQuery += "SELECT * FROM "+tableProps.name;
            if(record_id < records.length-1) {
                selectQuery+=";";
            }
        }
        
        var queryNumber = 0;
        runQuerySerialized(selectQuery,function(error,records) {
            writeArray[queryNumber].records = records;
            queryNumber++;
        },function(error,records) {
            for(var write_id in writeArray) {
                response.write(write_id+": "+writeArray[write_id].name+"\n");
                for(var prop_id in writeArray[write_id].records) {
                    response.write("\t\t"+prop_id+": ");
                    var subProp = "";
                    for(var subProp_id in writeArray[write_id].records[prop_id]) {
                        subProp += subProp_id+": "+writeArray[write_id].records[prop_id][subProp_id]+"; ";
                    }
                    response.write(subProp+"\n");
                }
            }
            
            response.end();
        });
    });
}

/**
   Shows all tables in database and can initialize database.

   @param {Object} response Response object for caller.
   @param {Boolean} shouldInit If true, database is initialized.
   @api public
 */
exports.load_customers = function(response, shouldInit, shouldInsert) {
    if(shouldInit === true) {
        init(response, './sql/initDB.sql');
    }
    else if(shouldInsert === true) {
        init(response, './sql/insertDB.sql');
    }
    else {
        listAllTables(response);        
    }
};


function makeQuery(db, query, handler, endHandler) {
    var queries = query.split(";");
    var query_count = queries.length;
    for(var i=0; i<queries.length; i++) {
        if(queries[i] !== "" || queries[i] != null) {
            db.all(queries[i], function (error, records) {
                query_count--;
                
                if( query_count <= 0 ) {
                    db.close();
                }
                
                if(handler !== null) {
                    handler(error,records);
                }
                
                if( query_count <= 0 && endHandler != null ) {
                    endHandler(error,records);
                }
            });
        }
        else query_count--;
    }
}

/**
   Runs specified query.

   @param {String} query Query that will be executed in database. There can be multiple queries in one string separated by ';'.
   @param {Object} handler Function that will be called after execution of each query.
   @param {Object} endHandler Function that will be called after execution of all queries.
   @api public
 */
function runQuery(query, handler, endHandler) {
    if(typeof query == 'string') {
        var db = new sqlite3.Database(DATABASE_PATH, function() {
            makeQuery(db, query, handler, endHandler);
        });
    }
    else {
        throw new Error("Expected query as a string");
    }
};

/**
   Runs specified query. If query string contains multiple queries, they will be executed one at a time in given order.

   @param {String} query Query that will be executed in database. There can be multiple queries in one string separated by ';'.
   @param {Object} handler Function that will be called after execution of each query.
   @param {Object} endHandler Function that will be called after execution of all queries.
   @api public
 */
function runQuerySerialized(query,handler,endHandler) {
    if( typeof query == 'string') {
        var db = new sqlite3.Database(DATABASE_PATH, function () {
            db.serialize(function() {
                makeQuery(db,query,handler,endHandler);
            });
        });
    }
    else {
        throw new Error("Expected query as a string");
    }
};



exports.runQuery = runQuery;
exports.runQuerySerialized = runQuerySerialized;
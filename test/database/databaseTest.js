var database = require("../../lib/database/database");

exports['Run Query: Create Table'] = function(test) {
    var createQuery = 'CREATE TABLE IF NOT EXISTS TestCreateTable ('
    +'id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,'
    +'name TEXT NOT NULL)';
    
    var selectQuery = "SELECT name FROM sqlite_master "+
                        "WHERE type = 'table'"+
                        "AND name = 'TestCreateTable'";
                        
    var dropQuery = "DROP TABLE IF EXISTS TestCreateTable";
    
    database.runQuery(createQuery,function(error) {
        if( error) {
            test.ok(false,"Create Error: "+error);
            test.done();
        }
        else {
            database.runQuery(selectQuery,function(error,records) {
                if( error) {
                    test.ok(false,"Select Error: "+error);
                }
                else {
                    test.equal(records[0].name,"TestCreateTable");
                }
                
                test.done();
                database.runQuery(dropQuery,function(error) {
                    if( error) {
                        test.ok(false,"Drop Error: "+error);
                    }
                });
            });
        }
    });
}

exports['Run Query: Multiple Queries'] = function(test) {
    var createQuery = 'CREATE TABLE IF NOT EXISTS TestMultipleQueries ('
    +'id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,'
    +'name TEXT NOT NULL)';
    
    var prices = new Array("high","low","normal");
    var pricesString = "";
    var insertQuery = "";
    for(var i=0; i<prices.length; i++) {
        insertQuery += "INSERT INTO TestMultipleQueries VALUES(NULL,'"+prices[i]+"');";
        pricesString += prices[i];
    }
    
    var selectQuery = "SELECT name FROM TestMultipleQueries";
                        
    var dropQuery = "DROP TABLE IF EXISTS TestMultipleQueries";
    
    database.runQuery(createQuery,function(error) {
        if( error) {
            test.ok(false,"Create Error: "+error);
            test.done();
        }
        else {
            database.runQuery(insertQuery,null,function(error) {
                if( error) {
                    test.ok(false,"Insert Error: "+error);
                    test.done();
                }
                else {
                    database.runQuery(selectQuery, function(error,records) {
                        if( error) {
                            test.ok(false,"Select Error: "+error);
                            test.done();
                        }
                        else {
                            var tempRecords = new Array();
                            for(var i in records) {
                                tempRecords.push(records[i].name);
                                for(var j=0; j<tempRecords.length-1; j++) {
                                    if(tempRecords[j][0] > tempRecords[j+1][0]) {
                                        var tempRecord = tempRecords[j];
                                        tempRecords[j] = tempRecords[j+1];
                                        tempRecords[j+1] = tempRecord;
                                    }
                                }
                            }
                            
                            var recordsString = "";
                            for(var i=0; i<tempRecords.length; i++) {
                                recordsString += tempRecords[i];
                            }
                            
                            test.equal(pricesString,recordsString);
                            test.done();
                            database.runQuery(dropQuery,function(error) {
                                if( error) {
                                    test.ok(false,"Drop Error: "+error);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

exports['Run Query Serialized: Serialized Queries'] = function(test) {
    var createQuery = 'CREATE TABLE IF NOT EXISTS TestSerializedQueries ('
    +'id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,'
    +'name TEXT NOT NULL)';
    
    var prices = new Array("high","low","normal");
    var pricesString = "";
    var insertQuery = "";
    for(var i=0; i<prices.length; i++) {
        insertQuery += "INSERT INTO TestSerializedQueries VALUES(NULL,'"+prices[i]+"');";
        pricesString += prices[i];
    }
    
    var selectQuery = "SELECT name FROM TestSerializedQueries";
                        
    var dropQuery = "DROP TABLE IF EXISTS TestSerializedQueries";
    
    database.runQuery(createQuery,function(error) {
        if( error) {
            test.ok(false,"Create Error: "+error);
            test.done();
        }
        else {
            database.runQuerySerialized(insertQuery,null,function(error) {
                if( error) {
                    test.ok(false,"Insert Error: "+error);
                    test.done();
                }
                else {
                    database.runQuery(selectQuery, function(error,records) {
                        if( error) {
                            test.ok(false,"Select Error: "+error);
                            test.done();
                        }
                        else {
                            var recordsString = "";
                            for(var i in records) {
                                recordsString += records[i].name;
                            }
                            
                            test.equal(pricesString,recordsString);
                            test.done();
                            database.runQuery(dropQuery,function(error) {
                                if( error) {
                                    test.ok(false,"Drop Error: "+error);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

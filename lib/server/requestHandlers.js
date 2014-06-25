/**
 Module responsible for handling url requests specified in index.js module.

 @author Maciej Reichwald
 */

var fs = require("fs"),
    url = require("url"),
    path = require("path"),
    util = require("util"),
    gcm = require('node-gcm'),
    multiparty = require('multiparty'),
    qs = require('querystring'),
    formidable = require("formidable"),
    database = require("../external/database");

exports.push = function(response, request) {
    console.log("Request handler 'start' was called.");

    var body = '<html>'+
        '<head>'+
        '<meta http-equiv="Content-Type" '+
        'content="text/html; charset=UTF-8" />' +
        '</head>'+
        '<body>'+
        '<form action="/pushUpload" enctype="multipart/form-data" method="get">'+
        '<input type="text" name="title" ><br/>'+
        '<textarea cols=160" rows="10" name="message" ></textarea><br/>'+
        '<input type="submit" value="Send message" >'+
        '</form>'+
        '</body>'+
        '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

exports.pushUpload = function(response, request, data) {
    console.log("Request handler 'push message' was called");
    console.log("Data: "+data);
    for(var i in data) {
        console.log("Data "+i+": "+data[i]);
    }

    var query = "SELECT * FROM User WHERE regId IS NOT NULL";
    database.runQuery(query, function(error,records) {
        if( error ) {
            console.log("DB Error during "+action+" : "+error);
            invalidRequest(response,"DB Error during "+action,error);
            return;
        }

        if(records == null || records.length <= 0 ) {
            console.log("No records");
            invalidRequest(response,"DB Error during "+action,error);
            return;
        }

        var registrationIds = [];
        for(var i in records) {
            console.log("RegId "+i+": "+records[i].regId);
            registrationIds.push(records[i].regId);
        }

        var message = new gcm.Message();
        var today = new Date();
        var pushMessage = {
            roomId: 10,
            userId: 0,
            login: data.title,
            text: data.message,
            sendDate: today.getTime()
        };
        var json = JSON.stringify(pushMessage);
        message.addDataWithObject({
            message: json
        });

        var sender = new gcm.Sender('AIzaSyBQ4GMfuDF2hxiodj4dz5jrizeD9N7quNQ');
        sender.sendNoRetry(message, registrationIds, function (err, result) {
            console.log("Push sent: "+result);
            response.writeHead(200, {'content-type': 'text/plain'});
            if( registrationIds.length > 1 ) {
                response.write('Sent message to '+registrationIds.length+' users:\n');
            } else {
                response.write('Sent message to one user:\n');
            }
            response.write(data.message);
            response.end();
        });

    });

    /*response.writeHead(200, {"Content-Type": "text/html"});	
     response.write("Received message:<br/>");
     response.write(request.postData);
     response.end();*/



    /*var form = new formidable.IncomingForm();
     console.log("about to parse");
     form.parse(request, function(error, fields, files) {
     console.log("parsing done");


     response.writeHead(200, {"Content-Type": "text/html"});
     response.write("Received message:<br/>");
     response.write(fields.text);
     response.end();
     });*/
}

/**
 Displays intro page.

 @param {Object} response Response object for caller.
 @param {Object} request Request object sent from caller.
 @api public
 */
exports.start = function(response, postData) {
    console.log("Request handler 'start' was called.");

    var body = '<html>'+
        '<head>'+
        '<meta http-equiv="Content-Type" '+
        'content="text/html; charset=UTF-8" />' +
        '</head>'+
        '<body>'+
        '<form action="/upload" enctype="multipart/form-data" method="post">'+
        '<input type="file" name="upload" multiple="multiple">'+
        '<input type="submit" value="Upload file" />'+
        '</form>'+
        '</body>'+
        '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

/**
 Displays test upload page.

 @param {Object} response Response object for caller.
 @param {Object} request Request object sent from caller.
 @api public
 */
exports.upload = function(response, request) {
    console.log("Request handler 'upload' was called");

    var form = new formidable.IncomingForm();
    console.log("about to parse");
    form.parse(request, function(error, fields, files) {
        console.log("parsing done");
        fs.rename(files.upload.path, "./assets/test.png", function(err) {
            if(err) {
                fs.unlink("./assets/test.png");
                fs.rename(files.upload.path, "./assets/test.png");
            }
        });

        response.writeHead(200, {"Content-Type": "text/html"});
        response.write("Received image:<br/>");
        response.write("<img src='/show' />");
        response.end();
    });
}

/**
 Displays tables listed in database.

 @param {Object} response Response object for caller.
 @param {Object} request Request object sent from caller.
 @api public
 */
exports.database_test = function(response, request) {
    var shouldInit = false;
    var shouldInsert = false;
    if( request.method == "GET") {
        var url_query = url.parse(request.url,true);
        shouldInit = url_query.query.init == "true";
        shouldInsert = url_query.query.insert == "true";
    }
    database.load_customers(response, shouldInit, shouldInsert);
}

/**
 Displays test page with uploaded images.

 @param {Object} response Response object for caller.
 @api public
 */
exports.show = function(response) {
    console.log("Request handler 'show' was called");
    fs.readFile("./assets/test.png", "binary", function(error, file) {
        if(error)
        {
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(error+"\n");
            response.end();
        } else {
            response.writeHead(200, {"Content-Type": "image/png"});
            response.write(file, "binary");
            response.end();
        }
    });
}

/**
 Loads file specified in uri parameter.

 @param {Object} uri Contains file url.
 @param {Object} response Response object for caller.
 @api public
 */
exports.load_static_file = function(uri, response) {
    var filename = path.join(process.cwd(), uri);
    console.log("Request for "+filename);

    fs.exists = fs.exists = fs.exists || require('path').exists;
    fs.exists(filename, function(exists) {
        if(!exists) {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write("404 File not found\n");
            response.end();
            return;
        }

        fs.readFile(filename, "binary", function(error, file) {
            if(error) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(error+"\n");
                response.end();
                return;
            }

            response.writeHead(200);
            response.write(file, "binary");
            response.end();
        });
    });
}  
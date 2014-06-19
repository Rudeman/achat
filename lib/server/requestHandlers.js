/**
   Module responsible for handling url requests specified in index.js module.

   @author Maciej Reichwald
 */
 
var fs = require("fs"),
    url = require("url"),
    path = require("path"),
    formidable = require("formidable"),
    database = require("../external/database");

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
/**
   Main server module.

   @author Maciej Reichwald
 */

var http = require('http'),
    url = require("url"),
    fs = require('fs'),
    socketio = require("socket.io"),
    router = require("../api/apiRouter").handleRequest,
    streamRouter = require("../streamapi/streamRouter").handleConnection;

/**
   Starts server.

   @param {Object} apiHandler apiHandler module object.
   @api public
 */

exports.start = function() {
    
    var server = http.createServer(function (request, response) {
        var pathname = url.parse(request.url).pathname;
		console.log("Request for "+pathname+" received.");
		router(response, request);

	} ).listen(8080);
	
	console.log("Server has started.");
    
    var socketOptions = {transports:['flashsocket', 'websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']};
    var io = socketio.listen(server,socketOptions).on('connection', function (socket) {
        streamRouter(io,socket);
    });
    
    io.set("log level",1);
}
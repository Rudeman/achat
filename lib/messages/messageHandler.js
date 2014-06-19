/**
   Module responsible for handling messages sent through Mobsharing API with oauth protocol.
   
   @author Maciej Reichwald
 */

var url = require('url');


/**
   Handles message sent thorugh POST or GET method.

   @param {Object} response Response object for caller.
   @param {Object} request Request object sent from caller.
   @api public
 */
exports.handleMessage = function(response, request) {
    request.setEncoding("utf8");

    if(request.method.toUpperCase() == "POST") {
        request.postData = "";
        request.addListener("data", function(postDataChunk) {
            request.postData += postDataChunk;
        });

        request.addListener("end", function() {
            handleMessage(request.postData, response);
        });
    }
    else if(request.method.toUpperCase() == "GET") {
        var url_query = url.parse(request.url,true);
        handleMessage(url_query.query, response);
    }
    else {
        response.write("Incorrect send method type");
        response.end();
    }

}

function handleMessage(message,response) {
    console.log(message);
    if(typeof message == 'string') {
        message = message.replace(/\r\n/g, "\",\"");
        message = message.replace(/=/g, "\":\"");
        message = "{\"" + message + "\"}";
        console.log(message);

        var msgObj = JSON.parse(message);
        try {
            var handler = require("./"+msgObj.type);
            handler.handle(msgObj.data, response);
        } catch (error) {
            console.log("Error caught: " + error);
            response.write("Error during post message handling: "+error)
            response.end();
        }
    }
    else if (typeof message == "object") {
        try {
            var handler = require("./"+message.type);
            handler.handle(message.data, response);
        } catch (error) {
            console.log("Error caught: " + error);
            response.write("Error during get message handling: "+error)
            response.end();
        }
    }
    else {
        response.write("Invalid message type");
        response.end();	   
    }
}
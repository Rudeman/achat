/**
   Module responsible for handling messages sent through Mobsharing API with oauth protocol.
   
   @author Maciej Reichwald
 */

var url = require('url'),
    qs = require('querystring'),
    user = require("./user/userHandler"),
    contact = require("./contact/contactHandler"),
    room = require("./room/roomHandler"),
    oauth = require("./oauth/oauthHandler"),
    untokened = require("./untokened/untokenedHandler"),
    invalidRequest = require("./commonMessages").invalidRequest,
    requestHandlers = require("../server/requestHandlers");

var actions = {
    "/me":user.doAction,
    "/contact":contact.doAction,
    "/room":room.doAction
};

var untokenedActions = {
    "/oauth":oauth.doAction,
    "/remindPassword":untokened.doAction,
    "/register":untokened.doAction
};

var handle = {
    "/start": requestHandlers.start,
    "/upload": requestHandlers.upload,
    "/show": requestHandlers.show,
    "/stream": requestHandlers.stream,
    "/database": requestHandlers.database_test,
    "load_file": requestHandlers.load_static_file
};

/**
   Handles message sent thorugh POST or GET method.

   @param {Object} response Response object for caller.
   @param {Object} request Request object sent from caller.
   @api public
 */
exports.handleRequest = function(response, request) {
    request.setEncoding("utf8");

    if(request.method.toUpperCase() == "POST" 
        || request.method.toUpperCase() == "DELETE" ) {
        request.postData = "";
        
        request.addListener("data", function(postDataChunk) {
            request.postData += postDataChunk;
        });

        
        request.addListener("end", function() {
            try {
                var url_query;
                if (request.method.toUpperCase() == "DELETE") {
                    url_query = qs.parse(request.url.substring(request.url.indexOf("?") + 1, request.url.length));
                } else {
                    console.log("data: "+request.postData);
                    url_query = JSON.parse(request.postData);
                }

                for (var i in url_query) {
                    console.log("PostData " + i + ": " + url_query[i]);
                }

                handleMessage(request, response, url_query);
            } catch (e) {
                console.log("Error during JSON parsing: "+e);
                handleMessage(request, response, request.postData);    
            }
        });
    } else if(request.method.toUpperCase() == "GET") {
        var url_query = url.parse(request.url,true);
        handleMessage(request, response,url_query.query);
    } else {
        response.setHeader('Content-Type', 'text/plain');
        response.write("Unknown send method type.");
        response.end();
    }

}

function handleMessage(request,response, data) {
    var action = url.parse(request.url,true).pathname;
    var actionEndIdx = action.substr(1).indexOf("/");
    
    if( actionEndIdx == -1 )
        actionEndIdx = action.length-1;
    if( actionEndIdx < -1 )
        actionEndIdx = -1;
    
    var subAction = action.substr(0,actionEndIdx+1);
    console.log(action+" "+actionEndIdx);
    console.log(subAction+" "+(typeof actions[subAction] === "function"));
        
    if( typeof actions[subAction] === "function" ) {
        data.tokenUserId = data.accessKey;
        actions[subAction](action, request, response, data)
        /*oauth.getAccessToken(data.accessKey,function(error,tokenObject){
            if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(response,"DB Error during access token match in "+action,error);
                return;
            }

            if( tokenObject != null && tokenObject.secret == data.accessSecret) {
                data.tokenUserId = tokenObject.userId;
                actions[subAction](action, request, response, data)
            }
            else {
               invalidRequest(response,action,"Invalid access token.");
            }
        });*/
    }
    else if( typeof untokenedActions[subAction] === "function" ) {
        untokenedActions[subAction](action, request, response, data);
    }
    else if( typeof handle[action] === 'function' ) {
        handle[action](response, request);
    }
    else
    {
        if(action == "/") {
            action = "/index.html";
        }
        else if(action == "/favicon.ico" ) {
            action = "/assets/images/favicon.ico"
        }
        
		handle['load_file'](action,response);
        
	}
}
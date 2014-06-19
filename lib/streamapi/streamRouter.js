var onError = require("./common").onError,
    CheckParam = require("./common.js").CheckParam,
    checkIsUndefined = require("./common.js").checkIsUndefined;

var handlers = {
    "message": require("./message").handle,
    "subscribe": require("./subscribe").handle,
    "addElement": require("./addelement").handle,
    "updateElement": require("./addelement").handleUpdate,
    "getElements": require("./getelement").handle,
    "deleteElement": require("./deleteelement").handle
};

function handleConnection(io,socket) {
    Object.keys(handlers).forEach( function(event){
        if( event == "subscribe") {
            socket.on(event, function(msg){
                 handlers[event](io, socket, msg);
            });
        }
        else {
            socket.on(event, function(msg){
                if( msg == null || checkIsUndefined(socket,[
                    new CheckParam(msg.accessKey,"Token"),
                    new CheckParam(msg.accessSecret,"Token")]) ) {
                    socket.disconnect();
                    return;
                }

                socket.get("userData",function(error,data){
                   if(error) {
                       onError(socket,"Error during cheking token: "+error);
                       socket.disconnect();
                       return;
                   }
                   
                   if( data && data.accessKey == msg.accessKey && data.accessSecret == msg.accessSecret) {
                       msg.tokenUserId = data.userId;
                       handlers[event](io, socket, msg, data);
                   }
                   else {
                       onError(socket,"Invalid token");
                       socket.disconnect();
                       return;
                    }
                });
            });
        }
    });
};

exports.handleConnection = handleConnection;
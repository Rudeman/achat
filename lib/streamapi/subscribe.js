var db = require("../external/database"),
    oauth = require("../api/oauth/oauthHandler"),
    onError = require("./common").onError,
    CheckParam = require("./common.js").CheckParam,
    checkIsUndefined = require("./common.js").checkIsUndefined,
    getRoomName = require("./elementModel").getRoomName;

function handle(io,socket,msg) {
    if( checkIsUndefined(socket,[
        new CheckParam(msg.accessKey,"Token"),
        new CheckParam(msg.accessSecret,"Token"),
        new CheckParam(msg.room,"Room id")]) ) {
        socket.disconnect();
        return;
    }
    
    oauth.getAccessToken(msg.accessKey,function(error,tokenObject){
        if( error ) {
            onError(socket,"Error during authorisation: "+error);
            socket.disconnect();
            return;
        }
        
        if( tokenObject != null && tokenObject.secret == msg.accessSecret) {
            var query = "SELECT * FROM UserRoom "+
                "WHERE userId = "+tokenObject.userId+" "+
                "AND roomId = "+msg.room;
                
            
            db.runQuery(query, function(error,records,sentQuery) {
                if( error ) {
                    console.log("Query: "+sentQuery+"\nDB Error: "+error);
                    onError(socket,"Query: "+sentQuery+"\nDB Error: "+error);
                    socket.disconnect();
                    return;
                }
                
                if( records && records.length > 0 ) {
                    console.log("socket joined room "+msg.room);
                    socket.set("userData",{
                            "userId":tokenObject.userId,
                            "roomId":msg.room,
                            "accessKey":msg.accessKey,
                            "accessSecret": msg.accessSecret
                    },function() {
                        socket.join(getRoomName()+msg.room);
                        socket.emit("subscribed"); 
                    });
                }
                else {
                    onError(socket,"User doesnt have access to this room.");
                    socket.disconnect();
                }
            });
        }
        else {
            onError(socket,"Invalid token");
            socket.disconnect();
            
        }
    });
};

exports.handle = handle;
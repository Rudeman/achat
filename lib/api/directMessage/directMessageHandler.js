var util = require("util"),
    MessageHandler = require("../messageHandler").MessageHandler,
    database = require("../../database/database"),
    validResponse = require("../commonMessages.js").validResponse,
    invalidRequest = require("../commonMessages.js").invalidRequest;
    
util.inherits(ChatMessageHandler, MessageHandler);
var handler = new ChatMessageHandler();

function ChatMessageHandler() {
    ChatMessageHandler.super_.call(this);
    this.className = "ChatMessageHandler";
    
    this.gets = {
        
    };

    this.posts = {
        "/chat_message/send":postSend,
    };
    
    this.deletes = {
        
    };
    
    //-------------------------------------------GETS---------------------------------------


    function postSend(req,res,data,action) {
        if( data.tokenUserId === undefined || data.tokenUserId === null ) {
            invalidRequest(res,action,"User id is undefined");
            return;
        }
        if( data.userId === undefined || data.userId === null ) {
            invalidRequest(res,action,"Destined user id is undefined");
            return;
        }
        if( data.message === undefined || data.message === null ) {
            invalidRequest(res,action,"Message is undefined");
            return;
        }
        
         var query = "SELECT COUNT(*) as count FROM User "+
            "WHERE id = "+data.userId;
    
        database.runQuery(query, function(error, records) {
            if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during destined user search in "+action,error);
                return;
            }
            
            
            if( records.length > 0 && records[0].count > 0 ) {
                var subQuery = "INSERT INTO DirectMessage VALUES("+
                    null+","+
                    data.userId+","+
                    data.tokenUserId+","+
                    (new Date()).time++","+
                    "'"+data.message+"')";
                    
                database.runQuery(subQuery,function(error) {
                    if( error ) {
                        console.log("DB Error during "+action+" : "+error);
                        invalidRequest(res,"DB Error during message insert in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "Direct message sent successfully.";
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                });
            }
            else {
               invalidRequest(res,action,"Destined user does not exist.");
            }
        });
    }
}

exports.doAction = handler.doAction;
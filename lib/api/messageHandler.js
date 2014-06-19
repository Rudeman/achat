var invalidRequest = require("./commonMessages").invalidRequest;


function MessageHandler() {
    this.className == "MessageHandler";
    this.gets = {};
    this.posts = {};
    this.deletes = {};
    
    var self = this;
    this.doAction = function(action,req,res,data) {
        if( typeof self.gets[action] === "function" ) {
            if( req.method.toUpperCase() == "GET" ) {
                self.gets[action](req,res,data,action);    
            }
            else invalidRequest(res,"Invalid send method","Cant find url "+action+" called through method "+req.method.toUpperCase() );
        }
        else if( typeof self.posts[action] === "function" ) {
            if( req.method.toUpperCase() == "POST" ) {
                self.posts[action](req,res,data,action);    
            }
            else invalidRequest(res,"Invalid send method","Cant find url "+action+" called through method "+req.method.toUpperCase() );
        }
        else if( typeof self.deletes[action] === "function" ) {
            if( req.method.toUpperCase() == "DELETE" ) {
                self.deletes[action](req,res,data,action);    
            }
            else invalidRequest(res,"Invalid send method","Cant find url "+action+" called through method "+req.method.toUpperCase() );
        }
        else {
            invalidRequest(res,"Invalid API command","Cant find url "+action);
        }
    }
} 

exports.MessageHandler = MessageHandler;
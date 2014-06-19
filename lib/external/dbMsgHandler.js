/**
   Class designed for test purposes. It shows what query caused error.DBMsgHandler
   
   @author Maciej Reichwald
 */

function DBMsgHandler (msg, handler) {
    this.msg = msg;
    this.handler = handler;
    
    onQueryComplete = function(error) {
        if(error) {
            console.log("Error from query: "+this.msg);
            console.log(error);
        }
    
        if(this.handler)
            this.handler();
    }
}

exports.DBMsgHandler = DBMsgHandler;
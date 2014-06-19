var util = require("util"),
    MessageHandler = require("../messageHandler").MessageHandler,
    database = require("../../external/database"),
    validResponse = require("../commonMessages.js").validResponse,
    invalidRequest = require("../commonMessages.js").invalidRequest,
    CheckParam = require("../commonMessages.js").CheckParam,
    checkIsUndefined = require("../commonMessages.js").checkIsUndefined,
    email = require("../../external/email");
    
util.inherits(UntokenedHandler, MessageHandler);
var handler = new UntokenedHandler();

function UntokenedHandler() {
    UntokenedHandler.super_.call(this);
    
    this.className = "UntokenedHandler";
    
    this.gets = {};

    this.posts = {
        "/remindPassword":postRemindPassWord,
        "/register":postRegister
    };
    
    this.deletes = {};
    
    //-------------------------------------------GETS---------------------------------------
    
    //-------------------------------------------POSTS---------------------------------------
    
    function postRegister(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.login,"User login"),
            new CheckParam(data.pass,"User password")]) ) {
            return;
        }
        
        var query = "SELECT COUNT(*) as count FROM User "+
            "WHERE login = '"+data.login+"'";
        
        database.runQuery(query,function(error,records){
            if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during login search in "+action,error);
                return;
            }
            
            if(records[0].count <= 0) {
                var createTime = new Date();
                
                query = "INSERT INTO User VALUES("+
                    "null,"+
                    "'"+(data.displayName !== undefined ? data.displayName : data.login)+"',"+
                    "'"+data.login+"',"+
                    "'"+data.pass+"',"+
                    createTime.getTime()+","+
                    createTime.getTime()+","+
                    "'/assets/images/avatars/noAvatar.png'"+
                    (data.permitPUSH == 1 ? 1 : 0)+","+
                    (data.permitEmail == 1 ? 1 : 0)+")";
                    
                
                database.runQuery(query,function(error,records){
                    if( error ) {
                        console.log("DB Error during "+action+": "+error);
                        invalidRequest(res,"DB Error during login search in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "User registered successfully."
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                });
            }
            else {
                invalidRequest(res,action,"User with given login already exists.");
                return;
            }
        });
    }
    
    
    function postRemindPassWord(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.login,"User login")]) ) {
            return;
        }
        
        var query = "SELECT displayName,pass,COUNT(*) as count FROM User "+
            "WHERE login = '"+data.login+"'";
        
        database.runQuery(query,function(error,records){
            if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during login search in "+action,error);
                return;
            }
            
            if(records[0].count > 0) {
                var mailOptions = new email.MailOptions(
                    "MobSharing <mobshare12@gmail.com>",
                    data.login,
                    "Password reming for user "+records[0].displayName,
                    "Hello "+records[0].displayName+",\n"+
                        "Your password is "+records[0].pass+"\nBetter write it somewhere before You forget it again!",
                    "<b>Hello "+records[0].displayName+",<br/>"+
                        "Your password is "+records[0].pass+"\nBetter write it somewhere before You forget it again!</b>"
                );
                
                email.sendEmail(mailOptions,function(error, response){
                    if(error){
                        invalidRequest(res,"Error during email send in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "Email with password reminder sent seccessfully."
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                    
                });
            }
            else {
                invalidRequest(res,action,"User with given login doesnt exist.");
                return;
            }
        });
    }
    
    
    //-------------------------------------------DELETES---------------------------------------
    
}

exports.doAction = handler.doAction;
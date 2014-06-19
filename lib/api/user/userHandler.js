var util = require("util"),
    MessageHandler = require("../messageHandler").MessageHandler,
    database = require("../../external/database"),
    validResponse = require("../commonMessages.js").validResponse,
    invalidRequest = require("../commonMessages.js").invalidRequest,
    CheckParam = require("../commonMessages.js").CheckParam,
    checkIsUndefined = require("../commonMessages.js").checkIsUndefined;
    
util.inherits(UserHandler, MessageHandler);
var handler = new UserHandler();

function UserHandler() {
    UserHandler.super_.call(this);
    
    this.className = "UserHandler";
    
    this.gets = {
        "/me":getData,
    };

    this.posts = {
        "/me/update":postUpdate,
        "/me/avatar/upload":postAvatarUpload
    };
    
    this.deletes = {};
    
    //-------------------------------------------GETS---------------------------------------
    
    function getData(req,res,data,action) {
        if( checkIsUndefined(res,action,[new CheckParam(data.tokenUserId,"User id")]) ) {
            return;
        }
        
        
        var query = "SELECT id,displayName,login,creationDate,lastLogin,avatar FROM User WHERE id = "+data.tokenUserId;
        
        database.runQuery(query, function(error,records) {
            if( error ) {
                console.log("DB Error during "+action+" : "+error);
                invalidRequest(res,"DB Error during "+action,error);
                return;
            }
            
            var user = records[0];
            if( user === null) {
                 invalidRequest(res,action,"Cant find User with id "+data.tokenUserId);
            }
            
            var subQuery = "SELECT COUNT(*) as count FROM Contact "+
                "WHERE Contact.userId = "+data.tokenUserId+";"+
                "SELECT COUNT(*) as count FROM UserRoom "+
                "WHERE UserRoom.userId = "+data.tokenUserId;
            
            var queryCounter = -1;
            var globalError = "";
            database.runQuerySerialized(subQuery,function(error,records){
                queryCounter++;
                
                if( error ) {
                    console.log("DB Error during "+action+" in query "+queryCounter+": "+error);
                    globalError += "DB Error during "+action+" in query "+queryCounter+": "+error+"\n";
                    return;
                }
                
                if(queryCounter===0) {
                    user.contactCount = records[0].count;
                }
                else if(queryCounter===1) {
                    user.roomCount = records[0].count;
                }
            },function(error) {
                if( error || globalError !== "" ) {
                    invalidRequest(res,"DB Error during "+action,globalError);
                    return;
                }
                
                var json = JSON.stringify(user);
                validResponse(res,json);
            });
        });
    }
    
    //-------------------------------------------POSTS---------------------------------------
    
    function postUpdate(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id")])) {
            return;
        }
        
        var displayName = data.displayName;
        if( isNotUndefined(displayName) ) {
            if( isEmpty(displayName) ) {
                invalidRequest(res,"Empty param","Can not change display name to empty string!");
            }
            else {
                var subQuery = "UPDATE User SET"+
                    " displayName = '"+data.displayName+"'"+
                    " WHERE id = "+data.tokenUserId;
                    
                database.runQuery(subQuery,function(error) {
                    if( error ) {
                        console.log("DB Error during "+action+" : "+error);
                        invalidRequest(res,"DB Error during displayName set in "+action,error);
                        return;
                    }

                    if( tryPassword(req,res,data,action) ) {
                        var resObj = {};
                        resObj.status = "Parameters changed successfully.";
                        
                        var json = JSON.stringify(resObj);
                        validResponse(res,json);
                    }
                });
            }
        }
        else if( tryPassword(req,res,data,action) ) {
            invalidRequest(res,"Empty params","Every parameter is empty! Fill some of them!");
        }
        
    }
    
    function isNotUndefined(param) {
        return param !== undefined && param !== null;
    }
    
    function isEmpty(param) {
        return param == "";
    }
    
    function tryPassword(res,req,data,action) {
        var oldPassword = data.oldPassword;
        var newPassword = data.newPassword;
        if( isNotUndefined(oldPassword) && isNotUndefined(newPassword) ) {
            if( isEmpty(oldPassword) || isEmpty(newPassword) ) {
                invalidRequest(res,"Every params","Passwords are can not be empty strings!");
            }
            else {
                changeUserPassword(res,req,data,action);
            }
            return false;
        }
        else {
            return true;
        }
    }
    
    function changeUserPassword(req,res,data,action) {
        var query = "SELECT COUNT(*) as count FROM User "+
            "WHERE id = "+data.tokenUserId+" "+
            "AND pass = '"+data.oldPassword+"'";
    
        database.runQuery(query, function(error, records) {
            if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during password match in "+action,error);
                return;
            }
            
            
            if( records.length > 0 && records[0].count > 0 ) {
                var subQuery = "UPDATE User SET"+
                    " pass = '"+data.newPassword+"'"+
                    " WHERE id = "+data.tokenUserId;
                    
                database.runQuery(subQuery,function(error) {
                    if( error ) {
                        console.log("DB Error during "+action+" : "+error);
                        invalidRequest(res,"DB Error during password set in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "Paramaeters changed successfully.";
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                });
            }
            else {
               invalidRequest(res,action,"Invalid user password.");
            }
        });
    }
    
    function postAvatarUpload(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.avatar,"Avatar string code")]) ) {
            return;
        }
        
        res.end();
    }
}

exports.doAction = handler.doAction;


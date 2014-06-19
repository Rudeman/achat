var util = require("util"),
    MessageHandler = require("../messageHandler").MessageHandler,
    database = require("../../external/database"),
    email = require("../../external/email"),
    validResponse = require("../commonMessages.js").validResponse,
    invalidRequest = require("../commonMessages.js").invalidRequest,
    CheckParam = require("../commonMessages.js").CheckParam,
    checkIsUndefined = require("../commonMessages.js").checkIsUndefined;
    
util.inherits(ContactHandler, MessageHandler);
var handler = new ContactHandler();

function ContactHandler() {
    ContactHandler.super_.call(this);
    this.className = "ContactHandler";
    
    this.gets = {
        "/contact/list":getList,
        "/contact/user":getUser
    };

    this.posts = {
        "/contact/add":postAdd,
        "/contact/invite":postInvite,
        "/contact/invite/accept":postInviteAccept,
        "/contact/invite/decline":postInviteDecline
    };
    
    this.deletes = {
        "/contact":deleteContact
    };
    
    //-------------------------------------------GETS---------------------------------------
    
    function getList(req,res,data,action) {
        if( checkIsUndefined(res,action,[new CheckParam(data.tokenUserId,"User id")]) ) {
            return;
        }
    
        var query = "SELECT User.avatar,User.displayName,User.id,User.login,User.lastLogin,Contact.isAccepted FROM User,Contact "+
            "WHERE Contact.userId = "+data.tokenUserId+" "+
            "AND Contact.contactId = User.id";
        
        database.runQuery(query, function(error,records) {
            if( error ) {
                //console.log("DB Error during "+action+" : "+error);
                invalidRequest(res,"DB Error during contact search in "+action,error);
                return;
            }
            
            var subQuery = "SELECT User.avatar,User.displayName,User.id,User.login FROM User,Contact "+
                "WHERE Contact.contactId = "+data.tokenUserId+" "+
                "AND Contact.userId = User.id "+
                "AND Contact.isAccepted = 0";
                
            database.runQuery(subQuery,function(error,invites){
                if( error ) {
                    console.log(subQuery);
                    invalidRequest(res,"DB Error during invites search in "+action,error);
                    return;
                }
                
                var jsonObj = {};
                jsonObj.contacts = [];
                jsonObj.myInvites = [];
                for(var i=0; i<records.length; i++) {
                    var contact = {};
                    contact.displayName = records[i].displayName;
                    contact.id = records[i].id;
                    contact.login = records[i].login;
                    contact.avatar = records[i].avatar;
                    if(records[i].isAccepted == 1) {
                        contact.lastLogin = records[i].lastLogin;
                        jsonObj.contacts.push(contact);
                    }
                    else {
                        contact.wasDeclined = records[i].isAccepted == -1;
                        jsonObj.myInvites.push(contact);
                        
                    }
                }
                
                jsonObj.userInvites = invites;
                
                var json = JSON.stringify(jsonObj);
                validResponse(res,json);
            });
        });
    }
    
    function getUser(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.id,"User id")])) {
            return;
        }
        
        var query = "SELECT avatar,id,displayName,login,creationDate,lastLogin FROM User WHERE id = "+data.id;
        
        database.runQuery(query, function(error,records) {
            if( error ) {
                console.log("DB Error during "+action+" : "+error);
                invalidRequest(res,"DB Error during "+action,error);
                return;
            }
            
            var user = records[0];
            if( user === null) {
                 invalidRequest(res,action,"Cant find User with id "+data.id);
            }
            
            var subQuery = "SELECT COUNT(*) as count FROM Contact "+
                "WHERE Contact.userId = "+data.id+";"+
                "SELECT COUNT(*) as count FROM UserRoom "+
                "WHERE UserRoom.userId = "+data.id;
            
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
    
    function postAdd(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.contactId,"Contact id")]) ) {
            return;
        }
        
        if( data.contactId == data.tokenUserId ) {
            invalidRequest(res,action,"User cant add himself to his contact list.");
            return;
        }
        
        var query = "SELECT COUNT(*) as count FROM User WHERE id = "+data.contactId;
        
        database.runQuery(query,function(error,records){
             if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during contactId search in "+action,error);
                return;
            }
            
            
            if( records.length > 0 && records[0].count > 0 ) {
                var subQuery = "INSERT OR REPLACE INTO Contact "+
                    "VALUES ("+
                    data.tokenUserId+","+
                    data.contactId+","+
                    (new Date()).getTime()+","
                    "1)";
                    
                database.runQuery(subQuery,function(error) {
                    if( error ) {
                        console.log("DB Error during "+action+" : "+error);
                        invalidRequest(res,"DB Error during contact add in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "Contact added successfully.";
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                });
            }
            else {
               invalidRequest(res,action,"User with given contact ID doesnt exist.");
            }
        });
    }
    
    function postInvite(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.login,"Login")]) ) {
            return;
        }
    
        
        var query = "SELECT id,COUNT(*) as count FROM User WHERE login = '"+data.login+"'";
        
        database.runQuery(query,function(error,records){
            if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during login search in "+action,error);
                return;
            }
            
            if( records.length > 0 && records[0].count > 0 ) {
                if( data.tokenUserId == records[0].id ) {
                    invalidRequest(res,action,"User cant invite himself to his contact list.");
                    return;
                }
                
                var subQuery = "INSERT INTO Contact "+
                    "VALUES ("+
                    data.tokenUserId+","+
                    records[0].id+","+
                    (new Date()).getTime()+","+
                    "0)";
                    
                database.runQuery(subQuery,function(error) {
                    if( error ) {
                        console.log("DB Error during "+action+" : "+error);
                        invalidRequest(res,"DB Error during contact add in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "Invite sent successfully.";
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                });
            }
            else {
               sendEmailInvite(req,res,data,action);
            }
        });
    }
    
    function sendEmailInvite(req,res,data,action) {
        
        var query = "SELECT * FROM User WHERE id = "+data.tokenUserId;
        
        database.runQuery(query, function(error,records){
            var mailOptions = new email.MailOptions(
                "MobSharing <mobshare12@gmail.com>",
                data.login,
                "Invitation to MobSharing",
                records[0].displayName+" is inviting you to MobSharing service.",
                "<b>"+records[0].displayName+" is inviting you to MobSharing service.</b>"
            );
            
            email.sendEmail(mailOptions,function(error, response){
                if(error){
                    console.log(error);
                }else{
                    console.log("Message sent: " + response.message);
                }
                var resObj = {};
                    resObj.status = response.message;
                var json = JSON.stringify(resObj);
                validResponse(res,json);
            });
        });
    }
    
    function postInviteAccept(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.inviterId,"Inviter id")]) ) {
            return;
        }
        
        if( data.invitertId == data.tokenUserId ) {
            invalidRequest(res,action,"User cant accept himself as his contact.");
            return;
        }
        
        var query = "SELECT COUNT(*) as count FROM User WHERE id = "+data.inviterId;
        
        database.runQuery(query,function(error,records){
             if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during contactId search in "+action,error);
                return;
            }
            
            
            if( records.length > 0 && records[0].count > 0 ) {
                var subQuery = "INSERT OR REPLACE INTO Contact "+
                    "VALUES ("+
                    data.tokenUserId+","+
                    data.inviterId+","+
                    (new Date()).getTime()+","+
                    "1);\n"+
                    "REPLACE INTO Contact "+
                    "VALUES ("+
                    data.inviterId+","+
                    data.tokenUserId+","+
                    (new Date()).getTime()+","+
                    "1)"
                    
                database.runQuery(subQuery,null,function(error) {
                    if( error ) {
                        console.log("DB Error during "+action+" : "+error);
                        invalidRequest(res,"DB Error during contact add in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "Contact invitation accepted.";
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                });
            }
            else {
               invalidRequest(res,action,"Inviter with given ID doesnt exist.");
            }
        });
    }
    
    function postInviteDecline(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.inviterId,"Inviter id")]) ) {
            return;
        }
        
        if( data.inviterId == data.tokenUserId ) {
            invalidRequest(res,action,"User cant decline himself from his contact list.");
            return;
        }
        
        var query = "SELECT COUNT(*) as count FROM User WHERE id = "+data.inviterId;
        
        database.runQuery(query,function(error,records){
             if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during contactId search in "+action,error);
                return;
            }
            
            
            if( records.length > 0 && records[0].count > 0 ) {
                var subQuery = "REPLACE INTO Contact "+
                    "VALUES ("+
                    data.inviterId+","+
                    data.tokenUserId+","+
                    (new Date()).getTime()+","+
                    "-1)";
                    
                database.runQuery(subQuery,function(error) {
                    if( error ) {
                        console.log("DB Error during "+action+" : "+error);
                        invalidRequest(res,"DB Error during contact add in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "Contact invitation declined.";
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                });
            }
            else {
               invalidRequest(res,action,"Inviter with given contact ID doesnt exist.");
            }
        });
    }
    
    //-------------------------------------------DELETES---------------------------------------
    
    function deleteContact(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.contactId,"Contact id")]) ) {
            return;
        }
        
        
        var query = "SELECT COUNT(*) as count FROM Contact "+
            "WHERE contactId = "+data.contactId+" "+
            "AND userId = "+data.tokenUserId;
        
        console.log(query);
        
        database.runQuery(query,function(error,records){
             if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during contactId search in "+action,error);
                return;
            }
            
            
            if( records.length > 0 && records[0].count > 0 ) {
                var subQuery = "DELETE FROM Contact "+
                    "WHERE contactId = "+data.contactId+" "+
                    "AND userId = "+data.tokenUserId;
                    
                database.runQuery(subQuery,function(error) {
                    if( error ) {
                        console.log("DB Error during "+action+" : "+error);
                        invalidRequest(res,"DB Error during contact delete in "+action,error);
                        return;
                    }
                    
                    var resObj = {};
                    resObj.status = "Contact deleted successfully.";
                    
                    var json = JSON.stringify(resObj);
                    validResponse(res,json);
                });
            }
            else {
               invalidRequest(res,action,"User does not have given contact.");
            }
        });
    }
}

exports.doAction = handler.doAction;
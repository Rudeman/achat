var util = require("util"),
    MessageHandler = require("../messageHandler").MessageHandler,
    database = require("../../external/database"),
    validResponse = require("../commonMessages.js").validResponse,
    invalidRequest = require("../commonMessages.js").invalidRequest,
    CheckParam = require("../commonMessages.js").CheckParam,
    checkIsUndefined = require("../commonMessages.js").checkIsUndefined,
    email = require("../../external/email");
    
util.inherits(RoomHandler, MessageHandler);
var handler = new RoomHandler();

function RoomHandler() {
    RoomHandler.super_.call(this);
    this.className = "RoomHandler";
    
    this.gets = {
        "/room/info":getInfo,
        "/room/list":getList,
        "/room/chat/list": getChatList
    };

    this.posts = {
        "/room/create":postCreate,
        "/room/user/add":postUserAdd,
        "/room/chat":postChat
    };
    
    this.deletes = {
        "/room":deleteRoom,
        "/room/resign":deleteResign,
        "/room/user":deleteUser
    };
    
    //-------------------------------------------GETS---------------------------------------

    function roomInfo(data,action, handler) {
        var query = "SELECT id,name,creationDate as created,lastUpdateDate as updated,width,height FROM Room WHERE id = "+data.id+";"+
            "SELECT userId FROM UserRoom "+
            "WHERE roomId = "+data.id+" AND isOwner = 1;"+
            "SELECT lastVisitDate FROM UserRoom "+
            "WHERE roomId = "+data.id+" AND userId = "+data.tokenUserId;
        
        var roomData = null;
        var owner = null;
        var lastVisitDate = null;
        var queryCounter = -1;
        var globalError = "";
        database.runQuerySerialized(query, function(error,records,sentQuery){
            queryCounter++;
            
            if( error ) {
                console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                globalError += "DB Error during room insert in "+action+" : "+error+"\n";
                return;
            }
            
            if( queryCounter == 0 && records.length > 0) {
                roomData = records[0];
            }
            else if( queryCounter == 1 && records.length > 0) {
                owner = records[0].userId;
            }
            else if( records.length > 0 ) {
                lastVisitDate = records[0].lastVisitDate;
            }
            
        }, function(error, records){
            if( error || globalError !== "" ) {                
                var errorMsg = {};
                errorMsg.title = "DB Error during "+action;
                errorMsg.msg = globalError;
                handler(errorMsg);
                return;
            }
            
            if( roomData == null ) {
                var errorMsg = {};
                errorMsg.title = action;
                errorMsg.msg = "Room with given id doesnt exist.";
                handler(errorMsg);
                return;
            }
            
            if( owner == null ) {
                var errorMsg = {};
                errorMsg.title = action;
                errorMsg.msg = "Room doesnt have owner. How could that happen?! O_O";
                handler(errorMsg);
                return;
            }
            
            if( lastVisitDate == null ) {
                lastVisitDate = 0;
            }
            
            query = "SELECT User.avatar,User.id,User.displayName,User.login FROM User,UserRoom "+
            "WHERE User.id = UserRoom.userId AND UserRoom.roomId = "+data.id+"; "+
            "SELECT COUNT(*) as count FROM ChatMessage "+
            "WHERE roomId = "+data.id+" "+
            "AND sendDate > "+lastVisitDate+";"+
            "SELECT COUNT(*) as count FROM Element "+
            "WHERE roomId = "+data.id+" "+
            "AND changeDate > "+lastVisitDate;
            
            var users = {};
            var chatCount = 0;
            var boardCount = 0;
            queryCounter = -1;
            globalError = "";
            database.runQuerySerialized(query, function(error,records,sentQuery){
                queryCounter++;
                
                if( error ) {
                    console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                    globalError += "DB Error during room insert in "+action+" : "+error+"\n";
                    return;
                }
                
                if( queryCounter == 0 && records.length > 0) {
                    users = records;
                }
                else if( queryCounter == 1 ) {
                    chatCount = records[0].count;
                }
                else {
                    boardCount = records[0].count;
                }
                
            }, function(error, records){
                if( error || globalError !== "" ) {                
                    var errorMsg = {};
                    errorMsg.title = "DB Error during "+action;
                    errorMsg.msg = globalError;
                    handler(errorMsg);
                    return;
                }
                
                roomData.owner = owner;
                roomData.chatCount = chatCount;
                roomData.boardCount = boardCount;
                roomData.users = users;
                
                handler(null,roomData);
            });
        });
    }

    function getInfo(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.id,"Room id")]) ) {
            return;
        }
        
        roomInfo(data,action,function(error,roomData){
            if( error ) {
                invalidRequest(res,error.title,error.msg);
                return;
            }
            
            var json = JSON.stringify(roomData);
            validResponse(res,json);    
        });
    }
    
    function getList(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id")]) ) {
            return;
        }
        
        var query = "SELECT Room.id FROM Room, UserRoom "+
            "WHERE UserRoom.userId = "+data.tokenUserId+" "+
            "AND Room.id = UserRoom.roomId";
        
        database.runQuery(query, function(error,records,sentQuery) {
            if( error ) {
                console.log("Query: "+sentQuery+"\nDB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during "+action,error);
                return;
            }
            
            var queryCounter = records.length;
            var roomDatas = [];
            for (var i=0; i<records.length; i++) {
                var tempData = {};
                tempData.id = records[i].id;
                tempData.tokenUserId = data.tokenUserId;
                var globalError = "";
                roomInfo(tempData,action,function(error,roomData) {
                    if(error) {
                        globalError += error.msg+"\n";
                    }
                    else {
                        roomDatas.push(roomData);
                    }
                    
                    queryCounter--;
                    
                    if(queryCounter == 0) {
                        if(globalError != "" ){
                            invalidRequest(res,action,globalError);
                            return;
                        }
                        
                        var json = JSON.stringify(roomDatas);
                        validResponse(res,json);
                    }
                })
            }
            
        });
    }
    
    function getChatList(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.id,"Room id")]) ) {
            return;
        }
    	
		var query = "SELECT ChatMessage.id, ChatMessage.text, ChatMessage.sendDate, "+
			"ChatMessage.userId, User.login "+
			"FROM ChatMessage,User,UserRoom "+
			"WHERE ChatMessage.userId = User.id "+
			"AND ChatMessage.roomId = "+data.id+" "+
            "AND UserRoom.roomId = "+data.id+" "+
            "AND UserRoom.userId = "+data.tokenUserId+" ";
		
		if( data.lastSendDate > 0 ) {
			query += "AND ChatMessage.sendDate >= "+data.lastSendDate+" ";
		}
        
		query += "ORDER BY ChatMessage.sendDate ASC ";
		console.log(query+" "+data.postLimit+" "+data.page);
		database.runQuery(query,function(error,records,sentQuery){
			if( error ) {                
                console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                invalidRequest(res,"DB Error during "+action,error);
                return;
            }
			
			var resObj = [];
			if( data.postLimit > 0 ) {
                if( !(data.page > 0) ) {
                    data.page = 0;
                }
                
				for(var i=data.postLimit*data.page; i<data.postLimit*(data.page+1) && i<records.length; i++) {
					resObj.push(records[i]);
				}
			}
			else {
				resObj = records;
			}
			
			var json = JSON.stringify(resObj);
            validResponse(res,json);
		});
    }
    
    //-------------------------------------------POSTS---------------------------------------
    
    function postCreate(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.name,"Room name"),
            new CheckParam(data.width,"Room width"),
            new CheckParam(data.height,"Room height")]) ) {
            return;
        }


        var query = "SELECT * FROM User WHERE id = "+data.tokenUserId+";";
        query += "SELECT MAX(id) as maxId FROM Room";

        if (data["invitedUsers[][id]"] !== undefined && data["invitedUsers[][id]"] !== null ) {
            
            for (var userId in data["invitedUsers[][id]"])
            {
                query += ";SELECT * FROM User WHERE id = " + data["invitedUsers[][id]"][userId];
            }
        }

        var userData;
        var roomMaxId;        
        console.log(query);
        var queryCounter = -1;
        var globalError = "";
        var userDatas = [];
        
        database.runQuerySerialized(query, function(error,records,sentQuery){
            queryCounter++;
            
            if( error ) {
                console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                globalError += "DB Error during room insert in "+action+" : "+error+"\n";
                return;
            }
            
            if( queryCounter == 0 ) {
                userData = records[0];
            }
            else if( queryCounter == 1 ) {
                roomMaxId = records[0].maxId+1;
            }
            else if( records.length > 0 ) {

                data["invitedUsers[][id]"][queryCounter-2].userData = records[0];
                userDatas[queryCounter-2] = records[0];
            }
            else {
                data["invitedUsers[][id]"][queryCounter-2].userData = null;
                userDatas[queryCounter-2] = null;
            }
        }, function(error, records){
            if( error || globalError !== "" ) {                
                invalidRequest(res,"DB Error during "+action,globalError);
                return;
            }
            
            var roomDate = (new Date()).getTime();
                
            var subQuery = "INSERT INTO Room VALUES("+
                roomMaxId+",'"+data.name+"',"+roomDate+","+roomDate+","+data.width+","+data.height+");";
                
            subQuery += "INSERT OR IGNORE INTO UserRoom VALUES("+
                data.tokenUserId+","+roomMaxId+",0,1,1,1)";
                
                
            if( userDatas !== undefined && userDatas !== null ) {
                 for (var userId in userDatas)
                  {
  
                    if( userDatas[userId] != null ) {
                        subQuery += ";INSERT INTO UserRoom VALUES("+
                            userDatas[userId].id+","+
                            roomMaxId+","+
                            "0,"+
                            (userDatas[userId].canEdit == 1 ? 1 : 0 )+","+
                            (userDatas[userId].canDelete == 1 ? 1 : 0 )+","+
                            "0)";   
                    }
                                    
                }
            }
            console.log(subQuery);
            globalError = "";
            database.runQuery(subQuery, function(error, subRecords,sentQuery) {
                if( error ) {
                    console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                    globalError += "DB Error during room insert in "+action+" : "+error+"\n";
                    return;
                }
            }, function (error) {
                if( error || globalError !== "" ) {                
                    invalidRequest(res,"DB Error during "+action,globalError);
                    return;
                }
                
                if( userData.permitEmail == 1 && data.invitedUsers !== undefined ) {
                    sendEmailInvite(userData,data.invitedUsers,data.name);
                }
                
                if( userData.permitPUSH == 1 && data.invitedUsers !== undefined ) {
                    sendPUSHInvite(userData,data.invitedUsers,data.name);
                }
                
                var resObj = {};
                resObj.status = "Room created successfully.";
                resObj.id = roomMaxId;
                              
                var json = JSON.stringify(resObj);
                validResponse(res,json);
            });
        });
        
        
    }
    
    function sendEmailInvite(userData,invitedUsers,roomName) {
        for(var i=0; i<invitedUsers.length; i++) {
            var mailOptions = new email.MailOptions(
                "MobSharing <mobshare12@gmail.com>",
                invitedUsers[i].userData.login,
                "Invitation to room "+roomName,
                "Hello "+invitedUsers[i].userData.displayName+",\n"+
                    userData.displayName+" is inviting you to room "+roomName+". Com quick and join!",
                "<b>Hello "+invitedUsers[i].userData.displayName+",<br/>"+
                    userData.displayName+" is inviting you to room "+roomName+". Com quick and join!</b>"
            );
            
            email.sendEmail(mailOptions,function(error, response){
                if(error){
                    console.log(error);
                }else{
                    console.log("Message sent: " + response.message);
                }
            });  
        }
    }
    
    function sendPUSHInvite(userData,invitedUsers,roomName) {
        //to do
    }
    
    function postUserAdd(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.id,"Room id"),
            new CheckParam(data.userId,"Added user id")])) {
            return;    
        }
        
        var query = "SELECT COUNT(*) as count FROM UserRoom "+
            "WHERE userId = "+data.tokenUserId+" "+
            "AND roomId = +"+data.id+" "+
            "AND isOwner = 1;";
        query += "SELECT COUNT(*) as count FROM User WHERE id = "+data.userId+";";
        query += "SELECT COUNT(*) as count FROM UserRoom "+
            "WHERE userId = "+data.userId+" AND roomId = "+data.id+";";
        
        var isOwner = false;
        var userExists = false;
        var userBelongs = true;
        var queryCounter = -1;
        var globalError = "";
        database.runQuerySerialized(query, function(error,records,sentQuery){
            queryCounter++;
            
            if( error ) {
                console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                globalError += "DB Error during room insert in "+action+" : "+error+"\n";
                return;
            }
            
            if( queryCounter == 0 ) {
                isOwner = records[0].count > 0;
            }
            else if( queryCounter == 1 ) {
                userExists = records[0].count > 0;
            }
            else {
                userBelongs = records[0].count > 0;
            }
        }, function(error, records){
            if( error || globalError !== "" ) {                
                invalidRequest(res,"DB Error during "+action,globalError);
                return;
            }
            
            if(isOwner == false) {
                invalidRequest(res,action,"User doesnt have required rights to add users.");
                return;
            }
            
            if(userExists == false) {
                invalidRequest(res,action,"Added user doesnt exist.");
                return;
            }
            
            if(userBelongs == true) {
                invalidRequest(res,action,"Added user is already assigned to room with given id.");
                return;
            }
            
            query = "INSERT INTO UserRoom VALUES("+
                data.userId+","+
                data.id+","+
                "0,"+
                (data.canEdit == 1 ? 1 : 0 )+","+
                (data.canDelete == 1 ? 1 : 0 )+","+
                "0)";
                
            database.runQuery(query,function(error,records,sentQuery){
                if( error || globalError !== "" ) {                
                    console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                    invalidRequest(res,"DB Error during "+action,error);
                    return;
                }
                
                var resObj = {};
                resObj.status = "User was added successfully.";
                
                var json = JSON.stringify(resObj);
                validResponse(res,json);
            });
        });
    }
    
    function postChat(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.id,"Room id"),
            new CheckParam(data.message,"Message")])) {
            return;    
        }
        
        var query = "SELECT COUNT(*) as count FROM Room WHERE id = "+data.id;
        
        database.runQuery(query,function(error,records,sentQuery){
            if( error ) {                
                console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                invalidRequest(res,"DB Error during room check in "+action,error);
                return;
            }
            
            if( records[0].count <= 0 ) {
                invalidRequest(res,action,"Room with given id does not exist.");
                return;
            }
            
            query = "INSERT INTO ChatMessage VALUES("+
                "null,"+
                data.tokenUserId+","+
                data.id+","+
                (new Date()).getTime()+","+
                "'"+data.message+"')";
                
            database.runQuery(query,function(error,records,sentQuery){
                if( error ) {                
                    console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                    invalidRequest(res,"DB Error during message insert in "+action,error);
                    return;
                }
                
                var resObj = {};
                resObj.status = "Message sent successfully.";
                
                var json = JSON.stringify(resObj);
                validResponse(res,json);
            });
            
        });
    }
    
    //-------------------------------------------DELETES---------------------------------------
    
    function deleteRoom(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.id,"Room id")])) {
            return;    
        }
        
        var query = "SELECT COUNT(*) as count FROM Room WHERE id = "+data.id+
            ";SELECT isOwner FROM UserRoom "+
            "WHERE userId = "+data.tokenUserId+" "+
            "AND roomId = "+data.id;
        
        var queryCounter = -1;
        var roomExists = false;
        var isOwner = false;
        var globalError = "";
        database.runQuerySerialized(query,function(error,records,sentQuery){
            queryCounter++;
            if( error ) {
                console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                globalError += "DB Error during "+action+" : "+error+"\n";
                return;
            }
            
            if( queryCounter == 0 ) {
                roomExists = records[0].count > 0;
            }
            else if( queryCounter == 1 ) {
                isOwner = records.length > 0 && records[0].isOwner == 1;
            }
            
        }, function(error, records) {
            if( error || globalError !== "" ) {                
                invalidRequest(res,"DB Error during "+action,globalError);
                return;
            }
            
            if( roomExists != true ) {
                invalidRequest(res,action,"Room with given id doesnt exist.");
                return;
            }
            
            if( isOwner != true ) {
                invalidRequest(res,action,"User doesnt have required rights to delete room with given id.");
                return;
            }
            
            query = "DELETE FROM Room WHERE id = "+data.id+";"+
                "DELETE FROM UserRoom WHERE roomId = "+data.id;
              
            globalError = "";
            database.runQuery(query,function(error,records,sentQuery){
                if( error ) {
                    console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                    globalError += "DB Error during room delete in "+action+" : "+error+"\n";
                    return;
                }
            }, function(error) {
                if( error || globalError !== "" ) {                
                    invalidRequest(res,"DB Error during "+action,globalError);
                    return;
                }
                
                var resObj = {};
                resObj.status = "Room deleted successfully.";
                
                var json = JSON.stringify(resObj);
                validResponse(res,json);
            });
        });
    }
    
    function deleteResign(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.id,"Room id")])) {
            return;    
        }
        
        var query = "SELECT isOwner FROM UserRoom "+
            "WHERE userId = "+data.tokenUserId+" "+
            "AND roomId = "+data.id;
        
        database.runQuery(query,function(error,records,sentQuery){
            if( error ) {
                console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                invalidRequest(res,"DB Error during "+action,error);
                return;
            }
            
            if( records.length <= 0 ) {
                invalidRequest(res,action,"User is not assigned to room with given id.");
                return;
            }
            else if( records[0].isOwner == 1 ) {
                invalidRequest(res,action,"User can't resign from room which he owns.");
                return;
            }
            
            query = "DELETE FROM UserRoom "+
                "WHERE roomId = "+data.id+" "+
                "AND userId = "+data.tokenUserId;
              
            database.runQuery(query,function(error,records,sentQuery){
                if( error  ) {
                    console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                    invalidRequest(res,"DB Error during user resign in "+action,error);
                    return;
                }
                
                var resObj = {};
                resObj.status = "User resigned successfully.";
                
                var json = JSON.stringify(resObj);
                validResponse(res,json);
            });
        });
    }
    
    function deleteUser(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.tokenUserId,"User id"),
            new CheckParam(data.id,"Room id"),
            new CheckParam(data.userId,"Added user id")])) {
            return;    
        }
        
        var query = "SELECT COUNT(*) as count FROM UserRoom "+
            "WHERE userId = "+data.tokenUserId+" "+
            "AND roomId = +"+data.id+" "+
            "AND isOwner = 1;";
        query += "SELECT COUNT(*) as count FROM UserRoom "+
            "WHERE userId = "+data.userId+" AND roomId = "+data.id+";";
        
        var isOwner = false;        
        var userBelongs = false;
        var queryCounter = -1;
        var globalError = "";
        database.runQuerySerialized(query, function(error,records,sentQuery){
            queryCounter++;
            
            if( error ) {
                console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                globalError += "DB Error during room insert in "+action+" : "+error+"\n";
                return;
            }
            
            if( queryCounter == 0 ) {
                isOwner = records[0].count > 0;
            }
            else {
                userBelongs = records[0].count > 0;
            }
        }, function(error, records){
            if( error || globalError !== "" ) {                
                invalidRequest(res,"DB Error during "+action,globalError);
                return;
            }
            
            if(isOwner == false) {
                invalidRequest(res,action,"User doesnt have required rights to remove users.");
                return;
            }
            
            if(userBelongs == false) {
                invalidRequest(res,action,"Removed user is not assigned to room with given id.");
                return;
            }
            
            query = "DELETE FROM UserRoom "+
                "WHERE userId = "+data.userId+" "+
                "AND roomId = "+data.id;
                
            database.runQuery(query,function(error,records,sentQuery){
                if( error || globalError !== "" ) {                
                    console.log("Query: "+sentQuery+"\nDB Error during "+action+" : "+error);
                    invalidRequest(res,"DB Error during "+action,error);
                    return;
                }
                
                var resObj = {};
                resObj.status = "User was removed successfully.";
                
                var json = JSON.stringify(resObj);
                validResponse(res,json);
            });
        });
    }
    
    
}

exports.doAction = handler.doAction;
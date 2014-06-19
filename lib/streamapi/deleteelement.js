var onError = require("./common").onError,
    CheckParam = require("./common.js").CheckParam,
    checkIsUndefined = require("./common.js").checkIsUndefined,
    deleteElement = require("./elementModel.js").deleteElement,
    getRoomName = require("./elementModel.js").getRoomName;


function handle(io,socket,msg,data) {
    if( checkIsUndefined(socket,[
        new CheckParam(msg.id,"Element id")]) ) {
        return;
    }
    
    deleteElement(data.roomId,msg.id,function() {
        var deletedElement = {"id":msg.id}
        io.sockets.in(getRoomName()+data.roomId).emit("deletedElement",deleteElement);
    });
}

exports.handle = handle;
    
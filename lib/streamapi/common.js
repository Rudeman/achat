function onError(socket,error,status) {
    console.log(error);
    
    var msg = {
        "error": error,
        "status": status || 404
    }
    socket.emit("error",msg);
};


function CheckParam(param,label) {
    this.param = param;
    this.label = label;
}

function checkIsUndefined(socket,checkParams) {    
    for(var i=0; i<checkParams.length; i++) {
        if( checkParams[i].param === undefined || checkParams[i].param === null ) {
            onError(socket,checkParams[i].label+" is required");
            return true;
        }  
    }
    
    return false;
}

exports.onError = onError;
exports.CheckParam = CheckParam;
exports.checkIsUndefined = checkIsUndefined;
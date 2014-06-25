var MESSAGE_FORMAT = 'application/json';

function invalidRequest(res, title, message, statusCode) {
    var error = {};
	statusCode = statusCode || 404;
    error.title = title;
    error.message = message;
    var errorJSON = JSON.stringify(error);
    console.log(error,errorJSON);
    
    res.setHeader('Content-Type', MESSAGE_FORMAT);
    res.statusCode = statusCode;
    res.write(errorJSON);
    res.end();
}

function validResponse(res,data){
    res.setHeader('Content-Type', MESSAGE_FORMAT);
    res.write(data);
    res.end();
}

function CheckParam(param,label) {
    this.param = param;
    this.label = label;
}

function checkIsUndefined(res,action,checkParams) {    
    for(var i=0; i<checkParams.length; i++) {
        console.log(checkParams[i]);
        if( checkParams[i].param === undefined || checkParams[i].param === null ) {
            invalidRequest(res,action,checkParams[i].label+" is required");
            return true;
        }  
    }
    
    return false;
}


exports.invalidRequest = invalidRequest;
exports.validResponse = validResponse;
exports.CheckParam = CheckParam;
exports.checkIsUndefined = checkIsUndefined;
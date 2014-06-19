function AccessToken (key, secret, consumerId, userId, accessType, timeStamp) {
    this.key = key;
    this.secret = secret;
    this.consumerId = consumerId;
    this.userId = userId;
    this.accessType = accessType || 'r';
    this.timeStamp = timeStamp || (new Date()).time;
    this.freeze = false;
}

function AccessTokenContainer() {
    this.name = "AccessToken";
    this.container = {};
}

AccessTokenContainer.prototype.parseDB = function(dbData) {
    if( dbData !== null ) {
            return new AccessToken(
                dbData.key,
                dbData.secret,
                dbData.consumerId,
                dbData.userId,
                dbData.accessType,
                dbData.callbackUrl,
                dbData.url);
        }
        else return null;
};

AccessTokenContainer.prototype.toDBString = function(tokenObject) {
    var query = 
        "null,"+
        "'"+tokenObject.key+"'," +
        "'"+tokenObject.secret+"'," +
        "'"+tokenObject.consumerId+"'," +
        ""+tokenObject.userId+"," +
        "'"+tokenObject.timeStamp+"'," +
        "'"+tokenObject.osType+"'," +
        "'"+tokenObject.accessType+"'";
        
    return query;
};

exports.AccessToken = AccessToken;
exports.AccessTokenContainer = AccessTokenContainer;
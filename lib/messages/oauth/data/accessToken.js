function AccessToken (key, secret, consumerKey, userID, accessType, timeStamp) {
    this.key = key;
    this.secret = secret;
    this.consumerKey = consumerKey;
    this.userID = userID;
    this.accessType = accessType || 'r';
    this.timeStamp = timeStamp || (new Date()).time;
    this.freeze = false;
};

function AccessTokenContainer() {
    this.name = "AccessToken";
    this.container = {};
};

AccessTokenContainer.prototype.parseDB = function(dbData) {
    if( dbData != null ) {
            return new AccessToken(
                dbData.key,
                dbData.secret,
                dbData.consumerKey,
                dbData.userId,
                dbData.accessType,
                dbData.callbackUrl,
                dbData.url);
        }
        else return null;
};

AccessTokenContainer.prototype.toDBString = function(tokenObject) {
    var query = 
        "'"+tokenObject.key+"'," +
        "'"+tokenObject.secret+"'," +
        "'"+tokenObject.consumerKey+"'," +
        ""+tokenObject.userId+"," +
        "'"+tokenObject.callbackUrl+"'," +
        "'"+tokenObject.accessType+"'," +
        "'"+tokenObject.url+"'";
        
    return query;
};

exports.AccessToken = AccessToken;
exports.AccessTokenContainer = AccessTokenContainer;
function Consumer (key, secret, name, descr, callbackUrl, accessType, url) {
    this.name = name || '';
    this.descr = descr || '';
    this.key = key;
    this.secret = secret;
    this.accessType = accessType || 'r';
    this.callbackUrl = callbackUrl || '';
    this.url = url || '';
};

function ConsumerContainer() {
    this.name = "ConsumerCredential";
    this.container = {};
};

ConsumerContainer.prototype.parseDB = function(dbData) {
    if( dbData != null ) {
            return new Consumer(
                dbData.key,
                dbData.secret,
                dbData.name,
                dbData.description,
                dbData.accessType,
                dbData.callbackUrl,
                dbData.url);
        }
        else return null;
};

ConsumerContainer.prototype.toDBString = function(consumer) {
    var query = 
        "'"+consumer.key+"'," +
        "'"+consumer.secret+"'," +
        "'"+consumer.name+"'," +
        "'"+consumer.description+"'," +
        "'"+consumer.callbackUrl+"'," +
        "'"+consumer.accessType+"'," +
        "'"+consumer.url+"'";
        
    return query;
};

exports.Consumer = Consumer;
exports.ConsumerContainer = ConsumerContainer;
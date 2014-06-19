function Consumer (params)
{
    this.id = params.id;
    this.key = params.key;
    this.secret = params.secret;
    this.osType = params.osType || '';
    this.timeStamp = params.timeStamp;
    this.accessType = params.accessType || 'r';
    this.name = params.name || '';
    this.description = params.description || '';
    this.callbackUrl = params.callbackUrl || '';
    this.url = params.url || '';
}

function ConsumerContainer() {
    this.name = "Consumer";
    this.container = {};
}

ConsumerContainer.prototype.parseDB = function(dbData) {
    if( dbData !== null ) {
            return new Consumer(dbData);
        }
        else return null;
};

ConsumerContainer.prototype.toDBString = function(data) {
    var consumer = new Consumer(data);
    
    var query = 
        "null,"+
        "'"+consumer.key+"'," +
        "'"+consumer.secret+"'," +
        "'"+consumer.osType+"'," +
        ""+consumer.timeStamp+"," +
        "'"+consumer.accessType+"'," +
        "'"+consumer.name+"'," +
        "'"+consumer.description+"'," +
        "'"+consumer.callbackUrl+"'," +        
        "'"+consumer.url+"'";
    console.log(query);
    return query;
};

exports.Consumer = Consumer;
exports.ConsumerContainer = ConsumerContainer;
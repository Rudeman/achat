var database = require("../../../external/database"),
    ConsumerContainer = require("./consumer").ConsumerContainer,
    RequestTokenContainer = require("./requestToken").RequestTokenContainer,
    AccessTokenContainer = require("./accessToken").AccessTokenContainer;

/**
   Initialize OAuthMemoryStore with optons.

   @api public
 */
 function OAuthMemoryStore () {
    this.consumers = new ConsumerContainer();
    this.accessTokens = new AccessTokenContainer();
    this.requestTokens = new RequestTokenContainer();
}

/**
   Lookup key in tokens or consumer dictionary/database.

   @param {Object} consumer Consumer object.
   @param {String} tokenKey Token key.
   @param {Object} store Dictionary with tokens.
   @return {Token|null} token Token object.
   @api private
 */
function lookup(key, store, handler) {
    var tokenObject = null;
    if( store.name == "RequestToken" ) {
        tokenObject = store.container[key]; 
        handler(tokenObject);
    }
    else {
        var query = "SELECT * FROM "+store.name+" WHERE key = '"+key+"'";
        database.runQuery(query, function(error,records) {
            if( error ) {
                console.log("OAuth Error: Error during selection from "+store.name+":\n"+error);
            }
            
            if(store.parseDB && records.length > 0) {
                tokenObject = store.parseDB(records[0]);
            }
            handler(error,tokenObject);
        });
    }
}

/**
   Search for consumer in OAuthMemoryStore by a public key.

   @param {String} key Consumer public key.
   @return {Object} fn Callback function.
   @api public
 */
OAuthMemoryStore.prototype.lookupConsumer = function (consumerKey, handler) {
    lookup(consumerKey, this.consumers, handler);
};

/**
   Lookup request token in OAuthMemoryStore.

   @param {String} tokenKey Request token key.
   @return {Object} fn Callback function.
   @api public
 */
OAuthMemoryStore.prototype.lookupRequestToken = function (tokenKey, handler) {
    lookup(tokenKey, this.requestTokens, handler);
};

/**
   Lookup access token in OAuthMemoryStore.

   @param {String} tokenKey Access token key.
   @return {Object} fn Callback function.
   @api public
 */
OAuthMemoryStore.prototype.lookupAccessToken = function (tokenKey, handler) {
    lookup(tokenKey, this.accessTokens, handler);
};

/**
   Add token or consumer to store.

   @param {Token} token Token to add.
   @param {Object} store Dict to save token.
   @api private
 */
function add(tokenObject, store, handler) {
    if( store.name == "RequestToken" ) {
        store.container[tokenObject.key] = tokenObject;
        if( handler != null )
            handler();
    }
    else {
        var query = "INSERT OR REPLACE INTO "+store.name+" VALUES ("+store.toDBString(tokenObject)+")";
        database.runQuery(query, function(error) {
            if( error ) {
                console.log("OAuth Error: Error during insertion into "+store.name+":\n"+error);
            }
            if( handler != null )
                handler(error,tokenObject);
        });
    }
}

/**
   Add new consumer to OAuthMemoryStore.

   @param {Object} consumer New consumer.
   @param {String} consumer.key Consumer public key.
   @param {String} consumer.secret Consumer private key.
   @param {String} consumer.name  Consumer display name.
   @api public
 */
OAuthMemoryStore.prototype.addConsumer = function (consumer, handler) {
    add(consumer, this.consumers, handler);
};

/**
   Add request token to OAuthMemoryStore.

   @param {Token} token Request token.
   @api public
 */
OAuthMemoryStore.prototype.addRequestToken = function (tokenObject, handler) {
    add(tokenObject, this.requestTokens, handler);
};

/**
   Add access token to OAuthMemoryStore.

   @param {Token} token Access token.
   @api public
 */
OAuthMemoryStore.prototype.addAccessToken = function (tokenObject, handler) {
    add(tokenObject, this.accessTokens, handler);
};

/**
   Remove token from store.

   @param {Token} token Token to remove.
   @param {Object} store Store for tokens.
   @api private
 */

function remove (key, store, handler) {
    if( store.name == "RequestToken" ) {
        delete store.container[key];
        if( handler != null )
            handler();
    }
    else {
        var query = "DELETE FROM "+store.name+" WHERE key = "+key+");";
        database.runQuery(query, function(error) {
            if( error ) {
                console.log("OAuth Error: Error during deletion from "+store.name+":\n"+error);
            }
            if( handler != null )
                handler();
        });
    }
    
}

/**
   Remove consumer in OAuthMemoryStore by a public key.

   @param {String} key Consumer public key.
   @api public
 */
OAuthMemoryStore.prototype.removeConsumer = function (key, handler) {
    remove(key, this.requestTokens, handler);
};

/**
   Remove request token.

   @param {Token} token Token to remove.
   @api public
 */
OAuthMemoryStore.prototype.removeRequestToken = function (key, handler) {
    remove(key, this.requestTokens, handler);
};

/**
   Remove request token.

   @param {Token} token Token to remove.
   @api public
 */
OAuthMemoryStore.prototype.removeAccessToken = function (key, handler) {
    remove(key, this.accessTokens, handler);
};

OAuthMemoryStore.prototype.authorizeRequestToken = function (token, user) {

};

exports.OAuthMemoryStore = OAuthMemoryStore;
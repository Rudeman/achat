var sys = require('util'),
    qs = require('querystring'),
    util = require('./util'),
    checkRequest = util.checkRequest,
    generateConsumerCredensials = util.generateConsumerCredensials,
    generateRequestToken = util.generateRequestToken,
    generateAccessToken = util.generateAccessToken,
    generateSkipAccessToken = util.generateSkipAccessToken,
    URL = require('url'),
    OAuthMemoryStore = require("./data/memory").OAuthMemoryStore,
    database = require("../../database/database"),
    validResponse = require("../commonMessages.js").validResponse,
    invalidRequest = require("../commonMessages.js").invalidRequest;


var store = new OAuthMemoryStore();

var actions = {
   // '/oauth/skip_code':getSkipCode,
    '/oauth/consumer_credentials':postConsumerCredentials,
    '/oauth/skip_access_token':postSkipAccessToken,
    '/oauth/request-token': requestToken,
    '/oauth/access-token': accessToken,
    '/oauth/authorize': authorize,
    '/oauth/authorize/allow': authorizeAllow,
    '/oauth/authorize/cancel': authorizeDeny
};

exports.doAction = function(action,req,res,data) {
    if( typeof actions[action] === "function") {
        actions[action](req,res,store,data,action);
        return true;
    }
    else {
        return false;
    }
};

exports.getAccessToken = function(key,handler) {
    if (typeof key !== 'string') {
        return null;
    }
    
    this.store.lookupAccessToken(key, handler);
};

/*function getSkipCode(req,res,store,data,action) {
    var query = "SELECT * FROM SkipCode";
    
    database.runQuery(query, function(error,records) {
        if( error ) {
            console.log("DB Error during "+action+": "+error);
            invalidRequest(res,"DB Error during skip code search in "+action,error);
            return;
        }
        
        if( records.length > 0 ) {
            var resObj = {};
            resObj.skipCode = records[0].code;
                
            var json = JSON.stringify(resObj);
            validResponse(res,json);
        }
        else {
           invalidRequest(res,action,"No skip codes were found.");
        }
    });
}*/

function postConsumerCredentials(req,res,store,data,action) {
    if( data.name === undefined || data.name === null ) {
        invalidRequest(res,action,"Consumer name required.");
        return;
    }
    if( data.description === undefined || data.descripton === null ) {
        invalidRequest(res,action,"Consumer description required.");
        return;
    }
    if( data.oauthNonce === undefined || data.oauthNonce === null ) {
        invalidRequest(res,action,"oauthNonce parameter required.");
        return;
    }
    
    var consumer = generateConsumerCredensials(data);
    store.addConsumer(consumer,function(error,consumerObj){
        if( error ) {
            console.log("DB Error during "+action+": "+error);
            invalidRequest(res,"DB Error during consumer addition in "+action,error);
            return;
        }
        
        var respObj = {};
        respObj.key = consumerObj.key;
        respObj.secret = consumerObj.secret;
        respObj.timeStamp = consumerObj.timeStamp;
        respObj.accessType = consumerObj.accessType;
        
        var json = JSON.stringify(respObj);
        validResponse(res,json);
    });
}

function postSkipAccessToken(req,res,store,data,action) {
    if( data.login === undefined || data.login === null ) {
        invalidRequest(res,action,"User login required.");
        return;
    }
    if( data.pass === undefined || data.pass === null ) {
        invalidRequest(res,action,"User password required.");
        return;
    }
    if( data.oauthNonce === undefined || data.oauthNonce === null ) {
        invalidRequest(res,action,"Nonce parameter required.");
        return;
    }
    if( data.consumerKey === undefined || data.consumerKey === null ) {
        invalidRequest(res,action,"Consumer credentials required.");
        return;
    }
    if( data.consumerSecret === undefined || data.consumerSecret === null ) {
        invalidRequest(res,action,"Consumer credentials required.");
        return;
    }
    
    store.lookupConsumer(data.consumerKey,function(error,consumer) {
        if( error ) {
            console.log("DB Error during "+action+": "+error);
            invalidRequest(res,"DB Error during consumer search in "+action,error);
            return;
        }
        
        if( consumer == null || consumer.secret != data.consumerSecret ) {
            invalidRequest(res,action,"Invalid consumer credentials.", 401);
            return;
        }
        
        var query = "SELECT COUNT(*) as count, id FROM User "+
            "WHERE login = '"+data.login+"' "+
            "AND pass = '"+data.pass+"'";
        
        database.runQuery(query,function(error,records){
            if( error ) {
                console.log("DB Error during "+action+": "+error);
                invalidRequest(res,"DB Error during user authorization in "+action,error);
                return;
            }
            
            if( records.length > 0 && records[0].count > 0 ) {
                consumer.nonce = data.oauthNonce;
                var accessToken = generateSkipAccessToken(consumer);
                accessToken.consumerId = consumer.id;
                accessToken.userId = records[0].id;
                accessToken.osType = consumer.osType;
                accessToken.accessType = consumer.accessType;
                
                store.addAccessToken(accessToken,function(error,accessTokenObj){
                    if( error ) {
                        console.log("DB Error during "+action+": "+error);
                        invalidRequest(res,"DB Error during access token addition in "+action,error);
                        return;
                    }
                    
                    var respObj = {};
                    respObj.key = accessTokenObj.key;
                    respObj.secret = accessTokenObj.secret;
                    respObj.timeStamp = accessTokenObj.timeStamp;
                    respObj.accessType = accessTokenObj.accessType;
                    
                    var json = JSON.stringify(respObj);
                    validResponse(res,json);
                });
            }
            else {
               invalidRequest(res,action,"Invalid user login or password.", 403);
            }
        });
    });
}
    

function requestToken(req, res, store, data, action) {
    if(req.headers.authorization) {
        console.log('STORE = ' + sys.inspect(store));
        checkRequest(req, store, function (error, params, consumer) {
            // console.log('check request. error = ' + sys.inspect(error));
            if (! error) {
                var token = generateRequestToken(params, consumer);
                store.addRequestToken(token);
                res.setHeader('Content-Type', 'text/plain');
                res.end('oauth_token='+ token.key + '&oauth_token_secret=' +
                          token.secret+ '&oauth_callback_confirmed=true');
                // additional params
            }
            else {
                res.setHeader('Content-Type', 'text/plain');
                console.log(error);
                res.statusCode = 404;
                res.end();
            }
        });
    }
    // else { missing authorization
}

function accessToken (req, res, store, data) {
    util.checkAccess(req, store, function (error, requestToken) {
        if (!error) {
            var accessToken = generateAccessToken(requestToken);
            store.addAccessToken(accessToken);
            store.removeRequestToken(requestToken);
            res.setHeader('Content-Type', 'text/plain');
            res.end('oauth_token=' + accessToken.key +
                      '&oauth_token_secret=' + accessToken.secret);
        }
        else {
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 404;
            res.end(error);
        }
    });

}

function authorize (req, res, store) {
    console.log('Inside /oauth/authorize');
    var query = qs.parse((URL.parse(req.url)).query);
    getRequestToken(query, store,  function (rt) {
        if (rt) {
            res.setHeader('Content-Type','text/html');
            var data =
                '<html> <head> <title> OAuth server test page </title> </head>' +
                '<body><h1>Allow ' + rt.consumer.name + ' application ? </h1>'+
                '<form action="/oauth/authorize/allow" method="post">' +
                '<input name="oauth_token" type="hidden" value="' +
                rt.key + '" />' +
                '<input type="submit" value="allow"/> </form>' +
                '<form action="/oauth/authorize/deny" method="post">' +
                '<input name="oauth_token" type="hidden" value="' +
                rt.key + '" />' +
                '<input type="submit" value="deny" name="cancel" /><form />' +


            '</body></html>';
            res.end(data);
        }
        else {
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 403;
            res.end('goes wrong');
        }
    });

}

function authorizeAllow(req, res, store) {
    authorizeAllowDeny(req, res, store, true);
}

function authorizeDeny(req, res, store) {
    authorizeAllowDeny(req, res, store, false);
}

function authorizeAllowDeny(req, res, store, allow) {
    if (req.method.toUpperCase() === 'POST') {
        var data = '';
        req.on('data', function (chunk) {
            data += chunk.toString();
        });

        req.on('end', function () {
            getRequestToken(qs.parse(data), store, function (rt) {
                if (rt) {
                    if (allow) {
                        // todo 
                        // check timestamp and nonce
                        // create access token and sent it to consumer
                        res.setHeader("Location",rt.consumer.callbackUrl +
                                             '?oauth_key=' + rt.key +
                                             '&oauth_secret=' + rt.secret);
                        res.statusCode = 302;
                        res.end();
                    }
                    else {
                        // todo
                        // deny access
                        // remove request token
                        res.setHeader('Content-Type', 'text/plain');
                        res.statusCode = 404;
                        res.end('Access from ' + rt.consumer.name + ' declined');
                    }
                }
                else {
                    invalidUrl(res);
                }
            });
        });
    } else {
        invalidUrl(res);
    }

}

function getRequestToken(query, store, handler) {
    if (typeof query.oauth_token !== 'string') {
        return null;
    }
    var key =  query.oauth_token.replace(/\"/g, '');
    store.lookupRequestToken(key, function (rt) {
        /*if (rt && query.oauth_verifier) {
            fn(query.oauth_verifier.replace(/\"/g, '') === rt.verifier ? rt : null);
        }*/
        handler(rt);
    });
}


function invalidUrl (res) {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 404;
    res.end("url invalid");
}

//exports.OAuthServer = OAuthServer;

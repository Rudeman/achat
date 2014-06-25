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
    nodeUtil = require("util"),
    MessageHandler = require("../messageHandler").MessageHandler,
    database = require("../../external/database"),
    validResponse = require("../commonMessages.js").validResponse,
    invalidRequest = require("../commonMessages.js").invalidRequest,
    CheckParam = require("../commonMessages.js").CheckParam,
    checkIsUndefined = require("../commonMessages.js").checkIsUndefined;
    
nodeUtil.inherits(OAuthHandler, MessageHandler);
var handler = new OAuthHandler();

function OAuthHandler() {
    OAuthHandler.super_.call(this);
    
    this.className = "OAuthHandler";

    this.gets = {        
    };

    this.posts = {
        "/oauth/consumer_credentials":postConsumerCredentials,
        "/oauth/skip_access_token":postSkipAccessToken
    };
    
    this.deletes = {};
    
    this.store = new OAuthMemoryStore();
    
    var self = this;
    this.getAccessToken = function(key,handler) {
        if (typeof key !== 'string') {
            return null;
        }
        
        self.store.lookupAccessToken(key, handler);
    };
    
    //-------------------------------------------GETS---------------------------------------
    
    //-------------------------------------------POSTS---------------------------------------

    function postConsumerCredentials(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.name,"Consumer name"),
            new CheckParam(data.description,"Consumer description"),
            new CheckParam(data.oauthNonce,"oauthNonce parameter")]) ) {
            return;
        }
        
        var consumer = generateConsumerCredensials(data);
        self.store.addConsumer(consumer,function(error,consumerObj){
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
    
    function postSkipAccessToken(req,res,data,action) {
        if( checkIsUndefined(res,action,[
            new CheckParam(data.login,"User login"),
            new CheckParam(data.pass,"User password"),
            new CheckParam(data.oauthNonce,"oauthNonce parameter"),
            new CheckParam(data.regId,"Device registration id parameter")]) ) {
            return;
        }

        var query = "SELECT COUNT(*) as count, id FROM User "+
            "WHERE login = '"+data.login+"' "+
            "AND pass = '"+data.pass+"'";

        database.runQuery(query,function(error,records) {
            if (error) {
                console.log("DB Error during " + action + ": " + error);
                invalidRequest(res, "DB Error during user authorization in " + action, error);
                return;
            }

            if (records.length > 0 && records[0].count > 0) {
                var consumer = {};
                consumer.id = 1;
                consumer.name = "AccessToken";
                consumer.secret = "abcdefghijklmnopqrstuvwxyz0123456789";
                consumer.description = "Android device";
                consumer.callbackUrl = "http://no-url.com";
                consumer.osType = "Android";
                consumer.nonce = data.oauthNonce;
                var accessToken = generateSkipAccessToken(consumer);
                accessToken.name="AccessToken";
                accessToken.consumerId = consumer.id;
                accessToken.userId = records[0].id;
                accessToken.osType = consumer.osType;
                accessToken.accessType = consumer.accessType;

                for (var i in accessToken) {
                    console.log("AccessType " + i + ": " + accessToken[i]);
                }

                self.store.addAccessToken(accessToken, function (error, accessTokenObj) {
                    if (error) {
                        console.log("DB Error during " + action + ": " + error);
                        invalidRequest(res, "DB Error during access token addition in " + action, error);
                        return;
                    }


                    var query = "UPDATE User "+
                        "SET regId = '"+data.regId+"' "+
                        "WHERE id = "+accessToken.userId;

                    database.runQuery(query,function(error,records) {
                        if (error) {
                            console.log("DB Error during " + action + ": " + error);
                            invalidRequest(res, "DB Error during user update in " + action, error);
                            return;
                        }

                        var respObj = {};
                        respObj.key = accessTokenObj.key;
                        respObj.secret = accessTokenObj.secret;
                        respObj.userId = accessTokenObj.userId;
                        respObj.timeStamp = accessTokenObj.timeStamp;
                        respObj.accessType = accessTokenObj.accessType;

                        var json = JSON.stringify(respObj);
                        validResponse(res, json);
                    });
                });
            }
            else {
                invalidRequest(res, action, "Invalid user login or password.", 403);
            }
        });
    }
    
    //-------------------------------------------DELETES---------------------------------------
    
    
    //-------------------------------------------ELSE---------------------------------------

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
}


exports.doAction = handler.doAction;
exports.getAccessToken = handler.getAccessToken;

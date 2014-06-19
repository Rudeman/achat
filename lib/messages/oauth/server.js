var sys = require('sys'),
qs = require('querystring');

//var Mstore = require('./oauth-store').OAuthMemoryStore,
//Consumer = require('./oauth-server').Consumer,
var util = require('./util'),
checkRequest = util.checkRequest,
generateRequestToken = util.generateRequestToken,
generateAccessToken = util.generateAccessToken,
URL = require('url'),
OAuthMemoryStore = require("./data/memory").OAuthMemoryStore;



function OAuthServer(actions, protectedActions) {
    
    this.store = new OAuthMemoryStore(); // || new require('./oauth-store').OAuthMemoryStore(),
    // todo update actions
    this.actions = {
        '/oauth/request-token': requestToken,
        '/oauth/access-token': accessToken,
        '/oauth/authorize': authorize,
        '/oauth/authorize/allow': authorizeAllow,
        '/oauth/authorize/cancel': authorizeDeny
    };
}

OAuthServer.prototype.parseAction = function (req, res) {
    var url = URL.parse(req.url).pathname; // todo regexp search
    if (typeof self.actions[url] === 'function') {
        this.actions[url](req, res, this.store);
    }
    else if (typeof self.protectedActions[url] === 'function' ){
        self.protectedActions[url](req, res, self.store);
    }
    else {
        invalidUrl(res);
        // error, page not found
    }
}

function requestToken(req, res, store) {
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
                res.setHeader('Content-Type', 'text/plain')
                console.log(error);
                res.statusCode = 404;
                res.end();
            }
        });
    }
    // else { missing authorization
}

function accessToken (req, res, store) {
    if (req.method.toUpperCase() === 'POST') {
        var data = '';
        req.on('data', function (chunk) {
            data += chunk.toString();
        });

        req.on('end', function () {
            util.checkAccess(req, store, function (error, requestToken) {
                if (!error) {
                    // save user id!
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
        });
    }
    else {
        invalidUrl(res);
    }

}

function authorize (req, res, store) {
    console.log('Inside /oauth/authorize');
    var query = qs.parse((URL.parse(req.url)).query);
    getRequestToken(query, store,  function (rt) {
        if (rt) {
            res.setHeader('Content-Type','text/html')
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
            res.setHeader('Content-Type', 'text/plain')
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
    res.statusCode = 404
    res.end("url invalid");
}

exports.OAuthServer = OAuthServer;

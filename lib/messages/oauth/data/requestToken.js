/**
   Token object.

   @param {String} key Token public key.
   @param {String} secret Token private key.
   @api public
 */
function RequestToken (key, secret, consumerKey, userID) {
    this.key = key;
    this.secret = secret;
    this.consumerKey = consumerKey;
    this.userID = userID;
};

function RequestTokenContainer() {
    this.name = "RequestToken";
    this.container = {};
};

exports.RequestToken = RequestToken;
exports.RequestTokenContainer = RequestTokenContainer;


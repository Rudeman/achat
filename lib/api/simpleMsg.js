/**
   Simple text message handler.

   @author Maciej Reichwald
 */

/**
   Handles text message sent through MobSharing API

   @param {Object} data Object that contains data sent from caller.
   @param {Object} response Response object for caller.
   @api public
 */
exports.handle = function(data, response) {
    response.write("I've got new data: " + data);
    response.end();
}
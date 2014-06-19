/**
   Start module.

   @author Maciej Reichwald
 */

var server = require("./lib/server/server"),
 apiHandler = require("./lib/api/apiHandler");

server.start(apiHandler.handleRequest);
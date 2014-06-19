/**
   Start module.

   @author Maciej Reichwald
 */

var server = require("./lib/server/server"),
 router = require("./lib/server/router"),
 requestHandlers = require("./lib/server/requestHandlers");

var handle = {};
//handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;
handle["/show"] = requestHandlers.show;
handle["/stream"] = requestHandlers.stream;
handle["/database"] = requestHandlers.database_test;
handle["/message"] = requestHandlers.message;
handle["load_file"] = requestHandlers.load_static_file;

server.start(router.route, handle);
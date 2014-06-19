/**
   Module that redirects server request to specified handler function in requestHandlers module.

   @author Maciej Reichwald
 */

/**
   Redirects to requested function, if it exists.

   @param {Array} handle Contains key strings that redirect to specified function from requestHandlers module.
   @param {String} pathname Contains key string for handle array.
   @param {Object} request Request object sent from caller.
   @param {Object} response Response object for caller.
   @api public
 */
exports.route = function (handle, pathname, response, request ) {
    console.log("About to route request for " + pathname );
    if( typeof handle[pathname] === 'function' ) {
		handle[pathname](response, request);
	} else if( pathname.substr(0,8) == "/message" ) {
        handle["/message"](response,request);
	}
    else
    {
        if(pathname == "/")
            pathname += "index.html";
        if(pathname != "/favicon.ico" )
		    handle["load_file"](pathname,response);
	}
}
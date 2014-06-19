var fs = require("fs");


exports.load_static_file = function(uri, response) {  
    var filename = path.join(process.cwd(), uri);  
    console.log("Request for "+filename);
    fs.exists(filename, function(exists) {  
        if(!exists) {  
            response.writeHead(404, {"Content-Type": "text/plain"});
        	response.write("404 File not found\n");
		    response.end();
            return;  
        }  
  
        fs.readFile(filename, "binary", function(error, file) {  
            if(error) {  
                response.writeHead(500, {"Content-Type": "text/plain"});
    		    response.write(error+"\n");
			    response.end();	
                return;  
            }  
  
            response.writeHead(200);
    		response.write(file, "binary");
			response.end();
        });  
    });  
}  
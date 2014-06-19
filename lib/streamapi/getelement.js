var getRoomElements = require("./elementModel.js").getRoomElements,
    parseFigureToObject = require("./elementModel.js").parseFigureToObject,
    onError = require("./common.js").onError;

function handle(io,socket,msg,data) {
    console.log("Receiving elements");
    getRoomElements(data.roomId,function(elements,error) {
        if(error) {
            onError(socket,error);
            return;
        }
        
        var parsed = [];
        if(elements != null) {
            for(var i=0; i<elements.length; i++) {
                parsed.push(parseFigureToObject(elements[i]));
            }    
        }
        
        console.log("Receiving function called");
        socket.emit("receivedElements",parsed); 
    });
}

exports.handle = handle;
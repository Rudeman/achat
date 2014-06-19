var onError = require("./common").onError,
    CheckParam = require("./common.js").CheckParam,
    checkIsUndefined = require("./common.js").checkIsUndefined,
    addElement = require("./elementModel.js").addElement,
    updateElement = require("./elementModel.js").updateElement,
    parseFigureToObject = require("./elementModel.js").parseFigureToObject,
    getRoomName = require("./elementModel.js").getRoomName;

var handlers = {
    "rectangle": getRectangleProperties,
    "ellipse": getEllipseProperties,
    "line": getLineProperties,
    "shape": getShapeProperties,
    "text": getTextProperties
};  

function handle(io,socket,msg,data) {
    if( checkIsUndefined(socket,[
        new CheckParam(msg.type,"Type")]) ) {
        return;
    }
    
    if( typeof handlers[msg.type] === 'function' ) {
        var element = {
            "roomId": data.roomId,
            "type": msg.type
        }
        var properties = handlers[msg.type](socket,msg);
        addElement(element,properties);
        var figure = {
            "element": element,
            "properties": properties,
            "isUpdate": false  
        };
        var parsed = parseFigureToObject(figure);
        io.sockets.in(getRoomName()+data.roomId).emit("addedElement",parsed);
    }
    else {
        onError(socket,"Invalid element type.");
    }
}

function handleUpdate(io,socket,msg,data) {
    if( checkIsUndefined(socket,[
        new CheckParam(msg.id,"Element id"),
        new CheckParam(msg.type,"Type")]) ) {
        return;
    }
    
    if( typeof handlers[msg.type] === 'function' ) {
        var element = {
            "id": msg.id,
            "roomId": data.roomId,
            "type": msg.type
        }
        var properties = handlers[msg.type](socket,msg);
        var figure = updateElement(element,properties);
        
        var parsed = parseFigureToObject(figure);
        io.sockets.in(getRoomName()+data.roomId).emit("updatedElement",parsed);
    }
    else {
        onError(socket,"Invalid element type.");
    }
}

function getRectangleProperties(socket,msg) {
    return getFigureProperties(socket,msg);
}

function getEllipseProperties(socket,msg) {
    return getFigureProperties(socket,msg);
}

function getFigureProperties(socket,msg) {
    if( checkIsUndefined(socket,[
        new CheckParam(msg.x,"X coordinate"),
        new CheckParam(msg.y,"Y coordinate"),
        new CheckParam(msg.zIndex,"Z index"),
        new CheckParam(msg.width,"Width"),
        new CheckParam(msg.height,"Height"),
        new CheckParam(msg.rotation,"Rotation"),
        new CheckParam(msg.border,"Border"),
        new CheckParam(msg.fillColor,"Fill color"),
        new CheckParam(msg.strokeColor,"Stroke color")]) ) {
        return;
    }
    
    var labels = ["x","y","zIndex","width","height","rotation","border","fillColor","strokeColor"];
    return getProperties(labels,msg);
}

function getLineProperties(socket,msg) {
    if( checkIsUndefined(socket,[
        new CheckParam(msg.points,"Points"),
        new CheckParam(msg.zIndex,"Z index"),
        new CheckParam(msg.border,"Border"),
        new CheckParam(msg.strokeColor,"Stroke color")]) ) {
        return;
    }
    
    var labels = ["zIndex","border","strokeColor"];
    var properties = getProperties(labels,msg);
    var points = {
        "name":"points",
        "value":JSON.stringify(msg.points)
    }
    properties.push(points);
    return properties;
}

function getShapeProperties(socket,msg) {
    if( checkIsUndefined(socket,[
        new CheckParam(msg.points,"Points"),
        new CheckParam(msg.zIndex,"Z index"),
        new CheckParam(msg.border,"Border"),
        new CheckParam(msg.strokeColor,"Stroke color")]) ) {
        return;
    }
    
    var labels = ["zIndex","border","strokeColor"];
    var properties = getProperties(labels,msg);
    return addPropertiesPoints(properties,msg.points);
}

function getTextProperties(socket,msg) {
    if( checkIsUndefined(socket,[
        new CheckParam(msg.x,"X coordinate"),
        new CheckParam(msg.y,"Y coordinate"),
        new CheckParam(msg.zIndex,"Z index"),
        new CheckParam(msg.width,"Width"),
        new CheckParam(msg.height,"Height"),
        new CheckParam(msg.rotation,"Rotation"),
        new CheckParam(msg.strokeColor,"Stroke color"),
        new CheckParam(msg.font,"Font"),
        new CheckParam(msg.size,"Size"),
        new CheckParam(msg.bold,"Bold"),
        new CheckParam(msg.italic,"Italic"),
        new CheckParam(msg.underline,"Underline"),
        new CheckParam(msg.text,"Text")]) ) {
        return;
    }
    
    var labels = ["x","y","zIndex","width","height","rotation","strokeColor","font","size","bold","italic","underline","text"];
    return getProperties(labels,msg);
}

function getProperties(labels,msg) {
    var properties = [];
    for(var i=0; i<labels.length; i++) {
        var property_id = labels[i];
        var property = {
            "name": property_id,
            "value": msg[property_id]
        };
        properties.push(property);
    }
    
    return properties;
}

function addPropertiesPoints(properties,points) {
    for(var i=0; i<points.length; i++) {
        var property = {
            "name": "point"+i,
            "value": points[i]
        };
        properties.push(property);
    }
    
    return properties;
}

exports.handle = handle;
exports.handleUpdate = handleUpdate;
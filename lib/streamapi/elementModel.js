var database = require("../external/database"),
    EventEmitter = require("events").EventEmitter;

var timeSince1970To2012 = 1000 * 3600 * 24 * (365 + 42/4) * (2012-1970);

var __elements;
var __emitter;
  
function getRoomName() {
    return "room";
}

function getElements() {
    if( __elements == null) {
        __elements = {};
    }
    
    return __elements;
}

function getEmitter() {
    if( __emitter == null ) {
        __emitter = new EventEmitter();
    }
    
    return __emitter;
}

function Element() {
    this.__unlocked = true;
    this.buforedElements = [];
    this.spareElements = [];
    
    this.getUnlocked = function() {
        return this.__unlocked;
    }
    
    this.setUnlocked = function(value) {
        this.__unlocked = value;
        if( this.__unlocked == true ) {
            getEmitter().emit("unlocked");
        }
    }
}

function Figure(element,properties,isUpdate) {
    this.element = element;
    this.properties = properties;
    this.isUpdate = isUpdate;
}

function parseFigureToObject(figure) {
    var element = {};
    element.id = figure.element.id;
    element.type = figure.element.type;
    element.changeDate = figure.element.changeDate;
    element.creationDate = figure.element.creationDate;
    
    for(var i=0; i<figure.properties.length; i++) {
        var property = figure.properties[i];
        if(property.name == "points") {
            element[property.name] = JSON.parse(property.value);
        }
        else {
            element[property.name] = property.value;
        }
    }
    
    /*var pointsObj = [];
    for(var i=0; i<figure.properties.length; i++) {
        var property = figure.properties[i];
        if(property.name.substr(0,5) == "point") {
            pointsObj.push(property);
        }
        else {
            element[property.name] = property.value;
        }
    }
    if( pointsObj.length > 0 ) {
        var points = [];
        for(var i=0; i<pointsObj.length;i++) {
            points.push(0);
        }
        for( var i=0; i<pointsObj.length; i++) {
            var index = pointsObj[i].name.substr(6);
            index = parseInt(index);
            points[index] = pointsObj[i].value;
        }
        
        element.points = points;
    }*/
    
    return element;
}

function deleteElement(roomId,elementId,callback) {
    var roomElements = getElements()[roomId];
    if( roomElements != null ) {
        splitGivenElement(roomElements.spareElements,elementId);
        splitGivenElement(roomElements.buforedElements,elementId);
        callback();
    }
    else {
        callback();
    }
}

function splitGivenElement(array,elementId) {
    for(var i=array.length-1; i>=0; i--) {
        if( array[i].element.id == elementId) {
            array.splice(i,1);
        }
    }
}

function getRoomElements(roomId,callback) {
    var roomElements = getElements()[roomId];
    if( roomElements != null ) {
        if( roomElements.getUnlocked() == true ) {
            getUnlockedRoomElements(roomId,callback);
        }
        else {
            getEmitter().once("unlocked",function() {
               getUnlockedRoomElements(roomId,callback);
            });
        }
    }
    else {
        callback(null);
    }
}

function getUnlockedRoomElements(roomId,callback) {
    var roomElements = getElements()[roomId];
    var spareElements = roomElements.spareElements;
    var buforedElements = roomElements.buforedElements;
    var figures = [];
    var figuresObj = {}
    var updates = [];
    
    addFigureToList(spareElements,updates,figures);
    addFigureToList(buforedElements,updates,figures);
    
    /*var query = "SELECT Element.id,Element.type,Element.creationDate,"+
    "Element.changeDate,Property.name,Property.value FROM Element,Property "+
    "WHERE Property.elementId = Element.id "+
    "AND Element.roomId = "+roomId;
    
    database.runQuery(query,null,function(error,records,subQuery){
        if(error) {
            console.log("DB Error while getting elemenets in query:\n"+subQuery+"\n"+error);
            callback(null,error);
            return;
        }
        
        //console.log("RECORDS: "+records);
        for(var i=0;i<records.length;i++) {
            var figure = figuresObj[records[i].id];
            if( figure == null ) {
                var element = {
                    "id":records[i].id,
                    "type":records[i].type,
                    "creationDate":records[i].creationDate,
                    "changeDate":records[i].changeDate
                }
                
                figure = new Figure(element,[],false);
                figuresObj[records[i].id] = figure;
            }
            
            var property = {
                "name":records[i].name,
                "value":records[i].value
            }
            
            figure.properties.push(property);
        }
        
        parseFiguresObjectToArray(figuresObj,figures,updates,callback);
        
    });*/
    
    parseUpdateFigures(figures,updates,callback);
}

function parseUpdateFigures(figures,updates,callback) {
    for(var i=0; i<figures.length; i++) {
        var figure = figures[i];
        
        for(var j=updates.length-1; j>=0; j--) {
            if(updates[j].element.id == figure.element.id ) {
                if( updates[j].element.changeDate > figure.element.changeDate ) {
                    figure.element.changeDate = updates[j].element.changeDate;
                    mergeProperties(figure.properties,updates[j].properties);
                }
                updates.splice(j,1);
            }
        }        
       
        if(i == figures.length-1) {
            console.log("Calling callback: i:"+i+" figures:"+figures.length);
            callback(figures);
        }    
    };
}

function parseFiguresObjectToArray(figuresObj,figures,updates,callback) {
    Object.keys(figuresObj).forEach( function(id){
        var figure = figuresObj[id];
        
        for(var i=0; i<updates.length; i++) {
            if(updates[i].element.id == figure.element.id
                && updates[i].element.changeDate > figure.element.changeDate ) {
                figure.element.changeDate = updates[i].element.changeDate;
                mergeProperties(figure.properties,updates[i].properties);
                updates.splice(i,1);
                break;
            }
        }
        
        figures.push(figure);
       
        if(Object.keys(figuresObj).length == figures.length) {
            callback(figures);
        }    
    });
}

function mergeProperties(figureProperties,updateProperties) {
    for(var i=0; i<figureProperties.length; i++) {
        var figurePropertie = figureProperties[i];
        for(var j=0; j<updateProperties.length; j++) {
            var updatePropertie = updateProperties[j];
            if( figurePropertie.name == updatePropertie.name) {
                figurePropertie.value = updatePropertie.value;
            }
        }
    }
}

function addFigureToList(elements,updates,figures) {
    for(var i=0; i<elements.length; i++) {
        if( elements[i].isUpdate == true ) {
            updates.push(elements[i]);
        }
        else {
            figures.push(elements[i]);
        }
    }
}

function addElement(element,properties) {
    var date = new Date();
    var time = date.getTime();
    element.id = time - timeSince1970To2012;
    console.log("New ELEMENT ID: "+element.id);
    element.creationDate = time;
    element.changeDate = time;
    
    var figure = new Figure(element,properties,false);
    addToBuforedElements(figure);
    
    return figure;
}

function parseAddQuery(figure) {
    var element = figure.element;
    var properties = figure.properties;
    
    var query = "INSERT OR REPLACE INTO Element VALUES("+
        element.id+","+
        element.roomId+","+
        "'"+element.type+"',"+
        element.creationDate+","+
        element.changeDate+");";
        
    for(var i=0; i<properties.length; i++) {
        var property = properties[i];
        query += "INSERT OR REPLACE INTO Property VALUES("+
        "null,"+
        element.id+","+
        "'"+property.name+"',"+
        "'"+property.value+"')";
        
        if( i < properties.length-1 ) {
            query += ";";
        }
    }
    
    return query;
}

function updateElement(element,properties) {
    var date = new Date();
    var time = date.getTime();
    element.changeDate = time;
    
    var figure = new Figure(element,properties,true);
    addToBuforedElements(figure);
    
    return figure;
}

function parseUpdateQuery(figure) {
    var element = figure.element;
    var properties = figure.properties;
    
    var query = "UPDATE Element SET "+
        "changeDate="+element.changeDate+" "+
        "WHERE id="+element.id+";";
        
    for(var i=0; i<properties.length; i++) {
        var property = properties[i];
        query += "UPDATE Property SET "+
        "value='"+property.value+"' "+
        "WHERE elementId="+element.id+" "+
        "AND name='"+property.name+"'";
        
        if( i < properties.length-1 ) {
            query += ";";
        }
    }
    
    return query;
}

function addToBuforedElements(figure) {
    var roomId = figure.element.roomId;
    var roomElements = getElements()[roomId];
    if( roomElements == null) {
        roomElements = new Element();
        roomElements.buforedElements.push(figure);
        getElements()[roomId] = roomElements;
    }
    else {
        var buforedElements = roomElements.buforedElements;
        var spareElements = roomElements.spareElements;
        if( buforedElements.length >= 10000000000000 ) {
            if( roomElements.getUnlocked() == true) {
                roomElements.setUnlocked(false);
                var query = "";
                for(var i=0; i<buforedElements.length; i++) {
                    if( buforedElements[i].isUpdate == true ) {
                        query += parseUpdateQuery(buforedElements[i]);
                    }
                    else {
                        query += parseAddQuery(buforedElements[i]);
                    }
                    if( i < buforedElements.length-1 ) {
                        query += ";";
                    }
                }
                
                database.runQuery(query,null,function(error,records,subQuery) {
                    if(error) {
                        console.log("DB Error during elemenets addition in query:\n"+subQuery+"\n"+error);
                        roomElements.setAddUnlocked(true);
                        return;
                    }
                    
                    clearArray(buforedElements);
                    
                    /*for( var i=0; i<spareElements.length; i++) {
                        buforedElements.push(spareElements[i]);
                    }
                    
                    clearArray(spareElements);*/
                    
                    roomElements.setUnlocked(true);
                });
            }
            else {
                //spareElements.push(figure);
                getEmitter().once("unlocked",function() {
                    buforedElements.push(figure);
                });
            }
        }
        else {
            buforedElements.push(figure);
        }  
    }
}

function clearArray(array) {
    for(var i=array.length; i>0; i--) {
        array.pop();
    }
}

exports.addElement = addElement;
exports.updateElement = updateElement;
exports.getRoomName = getRoomName;
exports.getRoomElements = getRoomElements;
exports.parseFigureToObject = parseFigureToObject;
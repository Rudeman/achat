function handle(io,socket,msg) {
    console.log('Message Received: ', msg);
    /*var rooms = io.sockets.manager.roomClients[socket.id];
    //console.log(socket);

    for( var id in rooms ) {
        console.log(id);
        if( id !== "" )  {
            if( rooms[id] === true) {
                var room_id = id.substring(1);
                io.sockets.in(room_id).emit("message",msg);
            }
        }
    }*/
};

exports.handle = handle;
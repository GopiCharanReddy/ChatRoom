import type { ServerWebSocket, WebSocket } from "bun";

type User = {
  ws: ServerWebSocket | unknown,
  room: string
}

const allSockets: User[] = [];
Bun.serve({
  port: 8080,
  fetch(req, server) {
    if(server.upgrade(req)) {
      return new Response("Connection successfull.", {status: 200})
    }
    return new Response("Upgrade failed.", { status: 500 })
  },
  websocket: {
    open(ws) {

    },
    message(ws, message) {
      //@ts-ignore
      const parsedMessage = JSON.parse(message);
      console.log(parsedMessage)
      if(parsedMessage.type == "join"){
        const roomId = parsedMessage.payload.roomId;
        allSockets.push({
          ws,
          room: roomId,
        })
      }
      if(parsedMessage.type == "chat"){
        let currentUserRoom = allSockets.find((x) => x.ws == ws)?.room
        for(let i=0; i< allSockets.length; i++) {
          if(allSockets[i]?.room == currentUserRoom){
            (allSockets[i]?.ws as ServerWebSocket).send(parsedMessage.payload.message)
          }
        }
      }
    },
  }
})
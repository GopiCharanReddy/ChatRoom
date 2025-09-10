import type { ServerWebSocket, WebSocket } from "bun";
import connectDb from "./database/indexdb";
import mongoose from "mongoose";
import crypto from "crypto"
connectDb();

const userSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);
const User = mongoose.model("User", userSchema);

const roomSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    users: {
      type: [userSchema],
    },
  },
  { timestamps: true }
);
const Room = mongoose.model("Room", roomSchema);

type UserWebSocket = ServerWebSocket<unknown> & { id: string };

type User = {
  id: string;
  ws: UserWebSocket;
  room: string;
};
const allSockets: User[] = [];
Bun.serve({
  port: 8080,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return new Response("Connection successfull.", { status: 200 });
    }
    return new Response("Upgrade failed.", { status: 500 });
  },
  websocket: {
    open(ws: UserWebSocket) {
      ws.id = crypto.randomUUID();
      console.log(ws.id)
      console.log(`Client ${ws.id} connected.`);
      ws.send(
        JSON.stringify({
          type: "welcome",
          id: ws.id
        })
      );
    },
    async message(ws: UserWebSocket, message) {
      const parsedMessage = JSON.parse(message.toString());
      const { type, payload } = parsedMessage;
      console.log(parsedMessage);
      if (parsedMessage.type == "create") {
        const newRoomId = crypto.randomUUID();
        const user = {
          socketId: ws.id,
          name: payload.name,
        };
        try {
          const newRoom = new Room({ _id: newRoomId, users: [user] });
          await newRoom.save();
          ws.send(
            JSON.stringify({
              type: "room_created",
              payload: {
                roomId: newRoomId
              },
            })
          );
          allSockets.push({
            id: ws.id,
            ws: ws,
            room: newRoomId
          })
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Failed to create Room.",
              error
            })
          );
        }
      }
      if (parsedMessage.type == "join") {
        try {
          const room = await Room.findById(payload.roomId);
          if (!room) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room not found."
              })
            );
            return;
          }
          if (room.users?.length >= 2) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room is full."
              })
            );
            return;
          }
          const newUser = { 
            socketId: ws.id,
            name: payload.name
          };
          room.users.push(newUser);
          await room.save();
          ws.send(JSON.stringify({
            type: "joinSuccess",
            payload: {
              roomId: room._id
            }
          }))
          allSockets.push({
            id: ws.id,
            ws: ws,
            room: room._id
          })
        } catch (error) {
          ws.send(JSON.stringify({
            type: "error",
            message: "Failed to join room."
          }))
        }
      }
      if (parsedMessage.type == "chat") {
        let sender = allSockets.find((user) => user.id == ws.id);
        if(!sender) return;
        const chatPayload = JSON.stringify({
          type: "chat",
          text: payload.message,
          senderId: ws.id
        })
        allSockets.forEach(user => {
          if(user.room === sender.room) {
            user.ws.send(chatPayload);
          }
        })
      }
    },
    async close(ws: UserWebSocket) {
      const socketIndex = allSockets.findIndex(user => user.id === ws.id);
      if(socketIndex > -1){
        allSockets.splice(socketIndex, 1);
      }
      try {
        const room = await Room.findOne({
          "users.socketId": ws.id,
        })
        if(!room) return;

        const userIndex = room.users.findIndex(user => user.socketId == ws.id)
        if(userIndex > -1){
          room.users.splice(userIndex, 1)
        }
        if(room.users.length === 0) {
          await Room.findByIdAndDelete(room._id);
          console.log(`Room ${room._id} was empty and has been deleted.`);
        }else {
          await room.save();
        }
      } catch (error) {
        console.error("Error during close: ",  error)
      }
    }
  },
});

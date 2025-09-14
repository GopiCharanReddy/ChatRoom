import type { ServerWebSocket, WebSocket } from "bun";
import connectDb from "./database/indexdb";
import mongoose from "mongoose";
import crypto from "crypto";
import { nanoid } from "nanoid";
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

type SocketData  = {
  id: string;
  name: string;
  roomId: string;
};
const server = Bun.serve<SocketData>({
  port: 8080,
  fetch(req, server) {
    if (server.upgrade(req, { data: { id: crypto.randomUUID()}})) {
      return;
    }
    return new Response("Upgrade failed.", { status: 500 });
  },
  websocket: {
    open(ws) {
      ws.data.id  = crypto.randomUUID();
      console.log(ws.data.id);
      console.log(`Client ${ws.data.id} connected.`);
      ws.send(
        JSON.stringify({
          type: "welcome",
          id: ws.data.id,
        })
      );
    },
    async message(ws, message) {
      const parsedMessage = JSON.parse(message.toString());
      const { type, payload } = parsedMessage;
      console.log(parsedMessage);
      if (parsedMessage.type == "create") {
        const newRoomId = nanoid(6);
        const user = {
          socketId: ws.data.id,
          name: payload.name,
        };
        ws.data.name = user.name;
        ws.data.roomId = newRoomId;
        if (!payload) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Name is required to create a room.",
            })
          );
          return;
        }
        try {
          const newRoom = new Room({ _id: newRoomId, users: [user] });
          await newRoom.save();
          ws.subscribe(newRoomId);
          ws.send(
            JSON.stringify({
              type: "roomCreated",
              payload: {
                roomId: newRoomId,
                userCount: 1
              },
            })
          );
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Failed to create Room.",
              error,
            })
          );
        }
      }
      if (parsedMessage.type == "join") {
        try {
          const { roomId, name } = payload;
          const room = await Room.findById(payload.roomId);
          console.log(room);
          if (!room) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room not found.",
              })
            );
            return;
          }
          if (room.users?.length >= 2) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room is full.",
              })
            );
            return;
          }
          const newUser = {
            socketId: ws.data.id,
            name: payload.name,
          };
          room.users.push(newUser);
          await room.save();
          ws.data.name = newUser.name
          ws.data.roomId = roomId
          ws.subscribe(roomId);
          server.publish(
            roomId,
            JSON.stringify({
              type: "joined",
              message: `${name} has joined the room.`, 
              senderId: ws.data.id,
              payload: {
                roomId: roomId,
                userCount: 2,
              }
            })
          );
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Failed to join room.",
            })
          );
        }
      }
      if (parsedMessage.type == "chat") {
        const { roomId, message } = payload;
        const room = await Room.findById(roomId);
        if (!room) return;
        const sender = room.users.find((user) => user.socketId === ws.data.id);
        if (!sender) return;
        server.publish(
          roomId,
          JSON.stringify({
            type: "chatMessage",
            text: message,
            senderName: sender.name,
            senderId: ws.data.id,
          })
        );
      }
    },
    async close(ws) {
      console.log(`Client ${ws.data.id} disconnected.`);
      try {
        const room = await Room.findOne({
          "users.socketId": ws.data.id,
        });
        if (!room) return;
        const leavingUser = room.users.find(
          (user) => user.socketId == ws.data.id
        );
        if (leavingUser) {
          server.publish(
            room._id,
            JSON.stringify({
              type: "userLeft",
              senderId: ws.data.id,
              message: `${leavingUser.name} has left the room.`,
              userCount: room.users.length - 1,
            })
          );
          room.users.pull(leavingUser)
        }
        if (room.users.length === 0) {
          await Room.findByIdAndDelete(room._id);
          console.log(`Room ${room._id} was empty and has been deleted.`);
        } else {
          await room.save();
        }
      } catch (error) {
        console.error("Error during close: ", error);
      }
    },
  },
});
console.log(`Bun server is listening  on port:${server.port}`)
import type { ServerWebSocket, WebSocket } from "bun";
import connectDb from "./database/indexdb";
import mongoose from "mongoose";
import crypto from "crypto";
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

type UserWebSocket = ServerWebSocket<unknown> & { id: string };

Bun.serve({
  port: 8080,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("Upgrade failed.", { status: 500 });
  },
  websocket: {
    open(ws: UserWebSocket) {
      ws.id = crypto.randomUUID();
      console.log(ws.id);
      console.log(`Client ${ws.id} connected.`);
      ws.send(
        JSON.stringify({
          type: "welcome",
          id: ws.id,
        })
      );
    },
    async message(ws: UserWebSocket, message) {
      const parsedMessage = JSON.parse(message.toString());
      const { type, payload } = parsedMessage;
      console.log(parsedMessage);
      if (parsedMessage.type == "create") {
        const newRoomId = crypto.randomUUID();
        if (!payload) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Name is required to create a room.",
            })
          );
          return;
        }
        const user = {
          socketId: ws.id,
          name: payload.name,
        };
        try {
          const newRoom = new Room({ _id: newRoomId, users: [user] });
          await newRoom.save();
          ws.subscribe(newRoomId);
          ws.send(
            JSON.stringify({
              type: "room_created",
              payload: {
                roomId: newRoomId,
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
            socketId: ws.id,
            name: payload.name,
          };
          room.users.push(newUser);
          await room.save();
          ws.subscribe(roomId);
          ws.publish(
            roomId,
            JSON.stringify({
              type: "joined",
              message: `${name} has joined the room.`,
            })
          );
          ws.send(
            JSON.stringify({
              type: "joinSuccess",
              payload: {
                roomId,
              },
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
        const sender = room.users.find((user) => user.socketId === ws.id);
        if (!sender) return;
        ws.publish(
          roomId,
          JSON.stringify({
            type: "chat",
            text: message,
            senderName: sender.name,
            senderId: ws.id,
          })
        );
      }
    },
    async close(ws: UserWebSocket) {
      console.log(`Client ${ws.id} disconnected.`);
      try {
        const room = await Room.findOne({
          "users.socketId": ws.id,
        });
        if (!room) return;
        const leavingUser = room.users.find(
          (user) => user.socketId == ws.id
        );
        if (leavingUser) {
          ws.publish(
            room._id,
            JSON.stringify({
              type: "userLeft",
              message: `${leavingUser.name} has left the room.`,
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

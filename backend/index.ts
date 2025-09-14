import { MongoClient, Db, Collection } from "mongodb";
import type { ServerWebSocket } from "bun";
import crypto from "crypto";
import { nanoid } from "nanoid";

if (!process.env.MONGODB_URL) {
  throw new Error("MONGODB_URL is not defined");
}
if (!process.env.PORT) {
  throw new Error("PORT is not defined");
}
if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not defined");
}

const client = new MongoClient(process.env.MONGODB_URL!);
await client.connect();
const db: Db = client.db("chatroom");
const rooms: Collection<RoomDocument> = db.collection("rooms");

interface User {
  socketId: string;
  name: string;
}

interface RoomDocument {
  _id: string;
  users: User[];
  createdAt?: Date;
  updatedAt?: Date;
}

type SocketData = {
  id: string;
  name?: string;
  roomId?: string;
};

const server = Bun.serve({
  port: Number(process.env.PORT),
  fetch(req, server) {
    if (server.upgrade(req, { data: { id: crypto.randomUUID() } })) return;
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": process.env.FRONTEND_URL!,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    return new Response("Upgrade failed.", { status: 500 });
  },
  websocket: {
    open(ws: ServerWebSocket<SocketData>) {
      ws.send(JSON.stringify({ type: "welcome", id: ws.data.id }));
    },
    async message(ws, message) {
      let parsed;
      try {
        parsed = JSON.parse(message.toString());
      } catch (error) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        return;
      }
      const { type, payload } = parsed;

      if (type === "create") {
        if (!payload?.name) {
          ws.send(JSON.stringify({ type: "error", message: "Name is required" }));
          return;
        }
        const newRoomId = nanoid(6);
        const user: User = { socketId: ws.data.id, name: payload.name };
        ws.data.name = user.name;
        ws.data.roomId = newRoomId;
        await rooms.insertOne({ _id: newRoomId, users: [user], createdAt: new Date(), updatedAt: new Date() });
        ws.subscribe(newRoomId);
        ws.send(JSON.stringify({ type: "roomCreated", payload: { roomId: newRoomId, userCount: 1 } }));
      }

      if (type === "join") {
        const { roomId, name } = payload;
        const room = await rooms.findOne({ _id: roomId });
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found." }));
          return;
        }
        if (room.users.length >= 2) {
          ws.send(JSON.stringify({ type: "error", message: "Room is full." }));
          return;
        }
        const newUser: User = { socketId: ws.data.id, name };
        room.users.push(newUser);
        ws.data.name = newUser.name;
        ws.data.roomId = roomId;
        await rooms.updateOne({ _id: roomId }, { $set: { users: room.users, updatedAt: new Date() } });
        ws.subscribe(roomId);
        server.publish(roomId, JSON.stringify({ type: "joined", message: `${name} has joined the room.`, senderId: ws.data.id, payload: { roomId, userCount: room.users.length } }));
      }

      if (type === "chat") {
        const { roomId, message } = payload;
        const room = await rooms.findOne({ _id: roomId });
        if (!room) return;
        const sender = room.users.find((u: User) => u.socketId === ws.data.id);
        if (!sender) return;
        server.publish(roomId, JSON.stringify({ type: "chatMessage", text: message, senderName: sender.name, senderId: ws.data.id }));
      }
    },
    async close(ws) {
      const room = await rooms.findOne({ "users.socketId": ws.data.id });
      if (!room) return;
      const leavingUser = room.users.find((u:User) => u.socketId === ws.data.id);
      if (leavingUser) {
        server.publish(room._id, JSON.stringify({ type: "userLeft", senderId: ws.data.id, message: `${leavingUser.name} has left the room.`, userCount: room.users.length - 1 }));
        room.users = room.users.filter((u: User) => u.socketId !== ws.data.id);
      }
      if (room.users.length === 0) {
        await rooms.deleteOne({ _id: room._id });
      } else {
        await rooms.updateOne({ _id: room._id }, { $set: { users: room.users, updatedAt: new Date() } });
      }
    },
  },
});

console.log(`Bun server listening on port: ${server.port}`);

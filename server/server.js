import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// create express app and http server 
const app = express();
const server = http.createServer(app);

// initialize socket.io server
export const io = new Server(server, {
    cors: { origin: "*" },
    pingTimeout: 60000 // optional: helps with frequent disconnects
});

// store online users
export const userSocketMap = {}; // userId: socketId

// socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User connected", userId);

    if (userId) userSocketMap[userId] = socket.id;

    // emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap)); // ✅ also fixed event name typo if needed

    socket.on("disconnect", () => {
        console.log("User disconnected", userId);
        delete userSocketMap[userId]; // ✅ CORRECTED here
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// middleware set up 
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// route setup
app.use("/api/status", (req, res) => res.send("server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// connect to db
await connectDB();

if(process.env.NODE_ENV !== "production"){

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log("Server is running on port: " + PORT));
}
export default server;
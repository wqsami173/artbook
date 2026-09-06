const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static(__dirname));


// =========================
// ROOMS
// =========================

const rooms = new Map();


io.on("connection", (socket) => {

    console.log(
        "User connected:",
        socket.id
    );


    // =========================
    // CREATE ROOM
    // =========================

    socket.on(
        "create-room",
        () => {

            let roomCode;

            do {

                roomCode =
                    Math.random()
                        .toString(36)
                        .substring(2, 8)
                        .toUpperCase();

            } while (
                rooms.has(roomCode)
            );


            rooms.set(
                roomCode,
                {
                    users: [socket.id]
                }
            );


            socket.join(roomCode);

            socket.roomCode =
                roomCode;


            socket.emit(
                "room-created",
                roomCode
            );


            console.log(
                `Room created: ${roomCode}`
            );

        }
    );


    // =========================
    // JOIN ROOM
    // =========================

    socket.on(
        "join-room",
        (roomCode) => {

            roomCode =
                roomCode
                    .trim()
                    .toUpperCase();


            if (!roomCode) {

                socket.emit(
                    "room-error",
                    "Please enter a room code."
                );

                return;

            }


            if (!rooms.has(roomCode)) {

                socket.emit(
                    "room-error",
                    "Room not found."
                );

                return;

            }


            const room =
                rooms.get(roomCode);


            if (
                room.users.length >= 2
            ) {

                socket.emit(
                    "room-error",
                    "Room is full."
                );

                return;

            }


            room.users.push(
                socket.id
            );


            socket.join(roomCode);

            socket.roomCode =
                roomCode;


            socket.emit(
                "room-joined",
                roomCode
            );


            socket.to(roomCode).emit(
                "player-joined"
            );


            console.log(
                `${socket.id} joined ${roomCode}`
            );

        }
    );


    // =========================
    // DRAW DOT
    // =========================

    socket.on(
        "draw-dot",
        (data) => {

            if (!socket.roomCode)
                return;


            socket
                .to(socket.roomCode)
                .emit(
                    "draw-dot",
                    data
                );

        }
    );


    // =========================
    // DRAW LINE
    // =========================

    socket.on(
        "draw",
        (data) => {

            if (!socket.roomCode)
                return;


            socket
                .to(socket.roomCode)
                .emit(
                    "draw",
                    data
                );

        }
    );


    // =========================
    // CLEAR CANVAS
    // =========================

    socket.on(
        "clear-canvas",
        () => {

            if (!socket.roomCode)
                return;


            socket
                .to(socket.roomCode)
                .emit(
                    "clear-canvas"
                );

        }
    );


    // =========================
    // DISCONNECT
    // =========================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "User disconnected:",
                socket.id
            );


            const roomCode =
                socket.roomCode;


            if (
                !roomCode ||
                !rooms.has(roomCode)
            ) {
                return;
            }


            const room =
                rooms.get(roomCode);


            room.users =
                room.users.filter(
                    id =>
                        id !== socket.id
                );


            if (
                room.users.length === 0
            ) {

                rooms.delete(
                    roomCode
                );


                console.log(
                    `Room deleted: ${roomCode}`
                );

            } else {

                io.to(roomCode).emit(
                    "player-left"
                );

            }

        }
    );

});


const PORT = 3000;


server.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const sala_1 = require("./classes/sala");
const dotenv_1 = require("dotenv");
const app = (0, express_1.default)();
const server = (0, node_http_1.createServer)(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
global.io = io;
(0, dotenv_1.config)();
server.listen(process.env.PORT || 3000, () => {
    console.log("Server escuchando en el puerto ", process.env.PORT);
});
let salas = [];
let idProximaSala = 0;
io.on("connection", (socket) => {
    //console.log("Nueva conexión");
    socket.on("encontrarSala", (callback) => buscarSalaPublica(callback));
    socket.on("crearSala", (args, callback) => crearSala(socket, callback, args));
    socket.on("unirseASala", (args, callback) => unirseASala(socket, callback, args));
    socket.on("disconnecting", () => {
        if (socket.rooms.size < 2)
            return;
        const salaJugador = salas.find(sala => sala.id == parseInt([...socket.rooms][1].substring(5)));
        if (!salaJugador)
            return;
        salaJugador === null || salaJugador === void 0 ? void 0 : salaJugador.jugadorAbandono();
        socket.conn.close();
        salas = salas.filter(sala => sala.id !== salaJugador.id);
        //console.log("Acabo de cerrar la sala",salaJugador.id,", ahora las salas son",salas)
    });
    socket.on("jugar", (args) => {
        var _a;
        //console.log("Registrando Jugada", args, socket.handshake.address);
        (_a = buscarSala(args.salaId)) === null || _a === void 0 ? void 0 : _a.jugar(args.jugador, args.posicion);
    });
    socket.on("nuevaRonda", (args) => {
        var _a;
        //console.log("Empezar nueva ronda");
        (_a = buscarSala(args.salaId)) === null || _a === void 0 ? void 0 : _a.nuevaRonda();
    });
});
/**BUSCA UNA SALA DISPONIBLE, SI LA ENCUENTRA RETORNA EL ID, SI NO, DEVUELVE NULL */
function buscarSalaPublica(callback) {
    //console.log("Buscando sala pública")
    const salaDisponible = salas.find(sala => {
        if (!sala.publica) {
            return false;
        }
        if (sala.jugadores[0].nombre && sala.jugadores[1].nombre) {
            return false;
        }
        return true;
    });
    callback(salaDisponible ? salaDisponible.id : null);
}
function crearSala(socket, callback, args) {
    //console.log("Debo crear una sala",args);
    const nuevaSala = new sala_1.Sala(args);
    nuevaSala.id = idProximaSala;
    idProximaSala++;
    salas.push(nuevaSala);
    unirseASala(socket, callback, {
        id: nuevaSala.id,
        nombreJugador: args.nombreJugador
    });
}
/** UNE UN JUGADOR A UNA SALA */
function unirseASala(socket, callback, args) {
    //console.log("Uniendo a sala",args);
    const salaIndex = salas.findIndex(sala => sala.id === args.id);
    if (!salas.length) {
        return callback({ exito: false, mensaje: "No existen salas" });
    }
    if (salaIndex === -1) {
        return callback({ exito: false, mensaje: "No existe la sala con ID " + args.id });
    }
    if (salas[salaIndex].jugadores[0].nombre && salas[salaIndex].jugadores[1].nombre) {
        return callback({ exito: false, mensaje: "La sala está llena" });
    }
    salas[salaIndex].agregarJugador(args.nombreJugador);
    socket.join("sala-" + salas[salaIndex].id);
    return callback({ exito: true, mensaje: "Unido a la sala " + salas[salaIndex].id, sala: salas[salaIndex].getSala() });
}
function buscarSala(id) {
    return salas.find(sala => sala.id === id);
}

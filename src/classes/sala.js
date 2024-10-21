"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sala = void 0;
const jugador_1 = require("../interfaces/jugador");
class Sala {
    constructor(args) {
        this.jugadores = [Object.assign({}, jugador_1.JUGADOR_VACIO), Object.assign({}, jugador_1.JUGADOR_VACIO)];
        this.estado = "ESPERANDO_COMPAÑERO";
        this.jugadorInicial = 0;
        this.tablero = ["", "", "", "", "", "", "", "", ""];
        this.publica = args.publica;
    }
    agregarJugador(nombre) {
        const indiceJugador = !this.jugadores[0].nombre ? 0 : 1;
        this.jugadores[indiceJugador].nombre = nombre;
        this.jugadores[indiceJugador].vidas = 3;
        if (this.jugadores[1].nombre) {
            this.estado = this.jugadorInicial === 0 ? "TURNO_P1" : "TURNO_P2";
        }
        this.comunicarSala();
    }
    getSala() {
        return {
            publica: this.publica,
            jugadores: this.jugadores,
            id: this.id,
            estado: this.estado,
            tablero: this.tablero,
            posicionGanadora: this.posicionGanadora
        };
    }
    /**COMUNICA EL ESTADO ACTUAL DE LA SALA A TODOS SUS INTEGRANTES*/
    comunicarSala() {
        global.io.to("sala-" + this.id).emit("sala", this.getSala());
    }
    jugadorAbandono() {
        this.estado = "ABANDONADO";
        this.comunicarSala();
    }
    jugar(numeroJugador, posicion) {
        if ((numeroJugador !== 1 && this.estado === "TURNO_P1") ||
            (numeroJugador !== 2 && this.estado === "TURNO_P2"))
            return;
        this.tablero[posicion] = numeroJugador;
        this.posicionGanadora = undefined;
        //CAMBIO DE TURNO
        this.estado = this.estado === "TURNO_P1" ? "TURNO_P2" : "TURNO_P1";
        //VERIFICACION VICTORIA O EMPATE
        const fin = this.verificarVictoria();
        if (fin === "EMPATE") {
            this.estado = "EMPATE";
        }
        else if (typeof fin === "object") {
            const indiceJugadorAfectado = numeroJugador === 1 ? 1 : 0;
            this.jugadores[indiceJugadorAfectado].vidas--;
            if (this.jugadores[indiceJugadorAfectado].vidas === 0) {
                this.estado = numeroJugador === 1 ? "VICTORIA_FINAL_P1" : "VICTORIA_FINAL_P2";
                this.posicionGanadora = fin;
            }
            else {
                this.estado = numeroJugador === 1 ? "VICTORIA_P1" : "VICTORIA_P2";
                this.posicionGanadora = fin;
            }
        }
        //COMUNICACION DE SALA FINAL
        this.comunicarSala();
    }
    verificarVictoria() {
        //verificar lineas horizontales
        for (let i = 0; i < 3; i += 3) {
            if (this.tablero[i] !== "" && this.tablero[i] === this.tablero[i + 1] && this.tablero[i] === this.tablero[i + 2]) {
                return [i, i + 1, i + 2];
            }
        }
        //verificar lineas verticales
        for (let i = 0; i < 3; i++) {
            if (this.tablero[i] !== "" && this.tablero[i] === this.tablero[i + 3] && this.tablero[i] === this.tablero[i + 6]) {
                return [i, i + 3, i + 6];
            }
        }
        //verificar lineas oblicuas
        if (this.tablero[0] !== "" && this.tablero[0] === this.tablero[4] && this.tablero[0] === this.tablero[8]) {
            return [0, 4, 8];
        }
        if (this.tablero[2] !== "" && this.tablero[2] === this.tablero[4] && this.tablero[2] === this.tablero[6]) {
            return [2, 4, 6];
        }
        //verifica empate
        if (!this.tablero.includes("")) {
            return "EMPATE";
        }
        return undefined;
    }
    nuevaRonda() {
        this.vaciarTablero();
        this.cambiarJugadorInicial();
        this.posicionGanadora = undefined;
        this.estado = this.jugadorInicial === 0 ? "TURNO_P1" : "TURNO_P2";
        if (this.jugadores[0].vidas === 0 || this.jugadores[1].vidas === 0) {
            this.jugadores[0].vidas = 3;
            this.jugadores[1].vidas = 3;
        }
        this.comunicarSala();
    }
    vaciarTablero() {
        this.tablero = ["", "", "", "", "", "", "", "", ""];
    }
    cambiarJugadorInicial() {
        this.jugadorInicial = this.jugadorInicial === 0 ? 1 : 0;
    }
}
exports.Sala = Sala;

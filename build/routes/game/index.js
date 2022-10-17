"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../services/database");
const config_json_1 = __importDefault(require("../../config/config.json"));
const crypto_1 = require("crypto");
const gameRoutes = (0, express_1.Router)();
gameRoutes.get('/', (_req, res) => {
    throw (new Error('Not implemented'));
});
gameRoutes.get('/new', (_req, res) => {
    const player1Id = (0, crypto_1.randomUUID)();
    const gameId = (0, crypto_1.randomUUID)();
    const turn = (Math.floor(Math.random() * 10) % 2) + 1;
    (0, database_1.createGame)(player1Id, gameId, turn, (result) => {
        if (result !== null) {
            throw (new Error(result));
        }
        else {
            res.json({
                url: `${config_json_1.default.PROTOCOL}://${config_json_1.default.HOSTNAME}:${config_json_1.default.PORT}/game/join/${gameId}`,
                gameId,
                turn,
            });
        }
    });
});
gameRoutes.get('/join/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const userId = (0, crypto_1.randomUUID)();
    console.log(userId, gameId);
    if (gameId === null) {
        res.status(400).end('0ds');
    }
    (0, database_1.getGame)(gameId, (error, game) => {
        if (error !== null || !game) {
            return res.status(400).end("1ds");
        }
        const players = game.players.split(',');
        console.log(players.length);
        if (players.length === 1) {
            console.log('players', players);
            players.push(userId);
            (0, database_1.addPlayerToGame)(gameId, players.join(','), (error) => {
                console.log(players.join('here,'));
                if (error !== null) {
                    return res.status(500).end('3ds');
                }
                else {
                    return res.json({
                        id: game.id,
                        turn: game.turn,
                        userId,
                    });
                }
            });
        }
        res.status(400);
        return res.end();
    });
});
gameRoutes.get('/stats/:gameId', (_req, res) => {
    throw (new Error('Not implemented'));
});
exports.default = gameRoutes;

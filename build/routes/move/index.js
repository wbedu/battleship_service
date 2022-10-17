"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gameRoutes = (0, express_1.Router)();
gameRoutes.get('/:gameId/', (req, res) => {
    const playerId = req.header('playerId');
    console.info(`move from playerId ${playerId}`);
    throw (new Error('Not implemented'));
});
exports.default = gameRoutes;

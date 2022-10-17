"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// Import the express in typescript file
const express_1 = __importDefault(require("express"));
const config_json_1 = __importDefault(require("./config/config.json"));
//routes
const game_1 = __importDefault(require("./routes/game"));
// Initialize the express engine
const app = (0, express_1.default)();
// Take a port 3000 for running server.
const port = (_a = config_json_1.default.PORT) !== null && _a !== void 0 ? _a : 3000;
// Handling '/' Request
app.get('/', (_req, _res) => {
    _res.send("TypeScript With Express");
});
// Server setup
app.listen(port, () => {
    console.log(`TypeScript with Express
         http://localhost:${port}/`);
});
app.use('/game', game_1.default);

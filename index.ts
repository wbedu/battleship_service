// Import the express in typescript file
import express from 'express';
import { WebSocketServer } from 'ws';
import config from './config/config.json';
import { HandleFire, handleJoinGame, handleSetShip } from './services/game';

// Initialize the express engine
const app: express.Application = express();
// Take a port 3000 for running server.
const httpPort: number = config.HTTP_PORT ?? 8081;

// Handling '/' Request
app.get('/', (_req, _res) => {
    _res.send("TypeScript With Express");
});

// Server setup
app.listen(httpPort, () => {
    console.log(`TypeScript with Express
         http://localhost:${httpPort}/`);
});

/**********
**sockets**
**********/
const socketPort: number = config.SOCKET_PORT ?? 8082;

const wss = new WebSocketServer({ port: socketPort });

wss.on('connection', (ws) => {
    console.log('connected');
    ws.on('error', console.error);
    ws.on('message', (data) => {
        let message: any;
        try {
            message = JSON.parse(data.toString());
        }
        catch (e) {
            console.error(e)
            ws.send(JSON.stringify({
                type: "failure",
                payload: {
                    message: "failed to parse message",
                }
            }));
            return;
        }

        try {
            switch (message.type) {
                case 'join_game':
                    handleJoinGame(ws, message);
                    break;
                case 'set_ship':
                    handleSetShip(ws, message);
                    break;
                case 'fire':
                    HandleFire(ws, message);
                    break;
                default:
                    // eslint-disable-next-line no-case-declarations
                    throw new Error(`unknown message type ${message?.type}`);

            }
        } catch (error: any) {
            console.error(error);
            ws.send(JSON.stringify({
                type: "failure",
                payload: {
                    message: error.message ?? error,
                }
            }));
        }

    });
});
// Import the express in typescript file
import express from 'express';
import { WebSocketServer } from 'ws';
import config from './config/config.json';
// import gameRoutes from './routes/game';
// import moveRoutes from './routes/move'
import { handleJoinGame, HandleSetBoard } from './services/game';

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
    console.log(ws, 'connected');
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
        switch (message.type) {
            case 'join_game':
                handleJoinGame(ws, message);
                break;
            case 'set_board':
                HandleSetBoard(ws, message);
                break;
            case 'fire':
                console.log(message);
                break;
            default:
                // eslint-disable-next-line no-case-declarations
                const errorMsg = `unknown message type ${message?.type}`
                console.error(errorMsg);
                ws.send(JSON.stringify({
                    type: "failure",
                    payload: {
                        message: errorMsg
                    }
                }));
        }

    });
});
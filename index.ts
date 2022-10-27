// Import the express in typescript file
import express from 'express';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';
import config from './config/config.json';
import gameRoutes from './routes/game';
import moveRoutes from './routes/move'
import { addPlayerToGame, createGame, getGame } from './services/database';
import { GameServiceType } from './routes/game/types';
import { randomUUID } from 'crypto';
import { handleCreateGame, HandleSetBoard } from './services/game';
import { AnyRecord } from 'dns';

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

app.use(bodyParser.json());
app.use('/game', gameRoutes)
app.use('/move', moveRoutes)

/**********
**sockets**
**********/
const socketPort: number = config.SOCKET_PORT ?? 8082;

const wss = new WebSocketServer({ port: socketPort });

wss.on('connection', (ws) => {
    ws.emit("message", 'wow');
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
            case 'create_game':
                handleCreateGame(ws, message);
                break;
            case 'set_board':
                HandleSetBoard(ws, message);
                break;
            case 'fire':
                console.log(message);
                break;
            default:
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

// io.on("connection", (socket) => {
//     socket.on('join', (data) => {
//         const { gameId } = data
//         const userId = randomUUID()
//         if (!gameId) {
//             socket.emit('player_error', {
//                 message: "invalid arguments",
//             });
//             return;
//         }
//         getGame(gameId, (error: unknown, game: GameServiceType | null) => {
//             if (error !== null || !game) {
//                 socket.emit('player_error', {
//                     message: "cannot find game",
//                 });
//                 return;
//             }
//             console.log(game.players)
//             const players = JSON.parse(game.players)
//             if (players.length === 1) {
//                 players.push(userId);
//                 addPlayerToGame(gameId, players, (error: unknown) => {
//                     if (error !== null) {
//                         socket.emit('player_error', {
//                             message: 'cannot add player to game',
//                         });
//                         return;
//                     } else {
//                         socket.emit('player_join', {
//                             id: game.id,
//                             turn: game.turn,
//                             userId,
//                         });
//                         socket.to(gameId).emit('Player Joined');
//                         return;
//                     }
//                 });
//             } else {
//                 socket.emit('player_error', 'too many players in game');
//             }
//         })
//     })

//     socket.on('message', (data) => {
//         console.log(`message: ${data.msg}`);
//         io.in(data.room).emit('message', data.msg);
//     });

//     socket.on('disconnect', () => {
//         console.log('user disconnected');

//         io.emit('message', 'user disconnected');
//     })
// });

// io.listen(8082)
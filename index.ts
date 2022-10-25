// Import the express in typescript file
import express from 'express';
import bodyParser from 'body-parser';
import { Server } from "socket.io";

import config from './config/config.json';
import gameRoutes from './routes/game';
import moveRoutes from './routes/move'
import { addPlayerToGame, getGame } from './services/database';
import { GameServiceType } from './routes/game/types';

// Initialize the express engine
const app: express.Application = express();
// Take a port 3000 for running server.
const port: number = config.PORT ?? 3000;

// Handling '/' Request
app.get('/', (_req, _res) => {
    _res.send("TypeScript With Express");
});

// Server setup
app.listen(port, () => {
    console.log(`TypeScript with Express
         http://localhost:${port}/`);
});

app.use(bodyParser.json());
app.use('/game', gameRoutes)
app.use('/move', moveRoutes)

/***********
**socketIO**
***********/

const io = new Server({ /* options */ });
io.on("connection", (socket) => {
    socket.on('join', (data) => {
        const {gameId} = data
        const userId = randomUUID()
        if (!gameId) {
            socket.emit('player_error',{
                message: "invalid arguments",
            });
            return;
        }
        getGame(gameId, (error: unknown, game: GameServiceType | null) => {
            if (error !== null || !game) {
                socket.emit('player_error',{
                    message: "cannot find game",
                });
                return;
            }
            console.log(game.players)
            const players = JSON.parse(game.players)
            if (players.length === 1) {
                players.push(userId);
                addPlayerToGame(gameId, players, (error: unknown) => {
                    if (error !== null) {
                        socket.emit('player_error',{
                            message: 'cannot add player to game',
                        });
                        return;
                    } else {
                        socket.emit('player_join',{
                            id: game.id,
                            turn: game.turn,
                            userId,
                        });
                        socket.to(gameId).emit('Player Joined');
                        return;
                    }
                });
            } else {
                socket.emit('player_error','too many players in game');
            }
        })
    })

    socket.on('message', (data) => {
        console.log(`message: ${data.msg}`);
        io.in(data.room).emit('message', data.msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');

        io.emit('message', 'user disconnected');
    })
});

io.listen(8082)
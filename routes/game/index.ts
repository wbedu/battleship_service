import { Router } from 'express';
import { addPlayerToGame, createGame, getBoard, getGame } from '../../services/database';
import config from '../../config/config.json';
import { randomUUID } from 'crypto';
import { GameServiceType } from './types';

const gameRoutes = Router();

gameRoutes.get('/', (_req, res) => {
    throw (new Error('Not implemented'));
})

gameRoutes.get('/new', (_req, res) => {
    const playerId = randomUUID();
    const gameId = randomUUID();
    const turn = (Math.floor(Math.random() * 10) % 2) + 1;
    createGame(playerId, gameId, turn, (result: any) => {
        if (result !== null) {
            throw (new Error(result));
        } else {
            res.json({
                url: `${config.PROTOCOL}://${config.HOSTNAME}:${config.PORT}/game/join/${gameId}`,
                gameId,
                playerId,
                turn,
            })
        }

    })
})

gameRoutes.get('/stat/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const userId = req.header('User-Id') ?? '';
    if (gameId === null) {
        res.status(400).end();
        return;
    }

    getGame(gameId, (error: unknown, game: GameServiceType | null) => {
        if (error !== null || !game) {
            res.status(400).end('cannot find game');
            return;
        }
        console.table(game)
        const players:string[] = JSON.parse(game.players);
        if (!players.includes(userId)) {
            res.status(401).end('You are not a player in this game');
            return;
        }

        const status = {
            playerCount: players.length,
            turn: game.turn,
            readyPlayers: 0
        };

        const expectedRes = players.length;
        let resolvedRes = 0;
        players.forEach(playerId => {
            getBoard(playerId, gameId, (error, row) => {
                if (error) {
                    res.status(500).end('something went wrong fething board data');
                    throw (new Error('something went wrong fething board data'))
                }
                if (row?.board) {
                    status.readyPlayers += 1
                }
                if (++resolvedRes == expectedRes) {
                    res.json(status).end();
                }
            })
        })

    })

})

gameRoutes.get('/join/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const userId = randomUUID()
    if (!gameId || !userId) {
        res.status(400).json({
            message: "invalid arguments",
            args: {
                gameId,
                userId,
                expected: ['param gameId', 'header User-Id'],
            }
        });
        return;
    }
    getGame(gameId, (error: unknown, game: GameServiceType | null) => {
        if (error !== null || !game) {
            res.status(400).end('cannot find game');
            return;
        }
        console.log(game.players)
        const players = JSON.parse(game.players)
        if (players.length === 1) {
            players.push(userId);
            addPlayerToGame(gameId, players, (error: unknown) => {
                if (error !== null) {
                    res.status(500).end('cannot add player to game');
                    return;
                } else {
                    res.json({
                        id: game.id,
                        turn: game.turn,
                        userId,
                    });
                    return;
                }
            });
        } else {
            res.status(400).end('too many players in game');
        }
    })

})

export default gameRoutes;
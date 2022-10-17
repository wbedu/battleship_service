import { Router } from 'express';
import { addPlayerToGame, createGame, getGame } from '../../services/database';
import config from '../../config/config.json';
import { randomUUID } from 'crypto';
import { GameServiceType } from './types';
import { GameDAO } from '../../services/database/types';

const gameRoutes = Router();

gameRoutes.get('/', (_req, res) => {
    throw (new Error('Not implemented'));
})

gameRoutes.get('/new', (_req, res) => {
    const player1Id = randomUUID();
    const gameId = randomUUID();
    const turn = (Math.floor(Math.random() * 10) % 2) + 1;
    createGame(player1Id, gameId, turn, (result: any) => {
        if (result !== null) {
            throw (new Error(result));
        } else {
            res.json({
                url: `${config.PROTOCOL}://${config.HOSTNAME}:${config.PORT}/game/join/${gameId}`,
                gameId,
                turn,
            })
        }

    })
})

gameRoutes.get('/join/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    const userId = randomUUID();
    console.log(userId, gameId)
    if (gameId === null) {
        res.status(400).end();
    }

    getGame(gameId, (error: unknown, game: GameDAO | null) => {
        if (error !== null || !game) {
            res.status(400).end();
            return;
        }
        const players = game.players.split(',');
        console.log(players.length)
        if (players.length === 1) {
            console.log('players', players)
            players.push(userId);
            addPlayerToGame(gameId, players.join(','), (error: unknown) => {
                console.log(players.join('here,'));
                if (error !== null) {
                    res.status(500).end();
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
            res.status(400).end();
        }
    })

})

gameRoutes.get('/stats/:gameId', (_req, res) => {
    throw (new Error('Not implemented'));
})

export default gameRoutes;
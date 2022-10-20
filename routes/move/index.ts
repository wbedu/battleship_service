import { Router } from "express";
import { setBoard, getGame, getBoard } from "../../services/database";
import { GameDAO, PlayerDAO } from "../../services/database/types";
import { validateBaord, boardMtxtoText } from "../../util/board";

const gameRoutes = Router()

gameRoutes.post('/setBoard/:gameId', (req, res) => {
    const playerId = req.header('User-ID');
    const gameId = req.params.gameId;
    const board: string[][] = req?.body?.board;
    if (!playerId || !gameId || !board) {
        res.status(400).json({
            message: "invalid arguments",
            args: {
                board,
                playerId,
                gameId,
            }
        }).end('');
        return;
    }

    getGame(gameId, (error: unknown, game: GameDAO | null) => {
        if (error || !game) {
            res.status(500).end('cannot find game');
            return;
        }

        const players = game.players.split(',');
        if (!players.includes(playerId)) {
            res.status(400).end('player does not have access');
            return;
        }

        if (!validateBaord(board)) {
            res.status(400).end('invalid board');
            return;
        }

        getBoard(playerId, gameId, (error: unknown, row: PlayerDAO | null) => {
            if (error) {
                res.status(500).end('invalid board');
                return;
            }
            if (row?.board) {

                res.status(400).json({
                    message: 'board already set',
                    testBoard: row?.board,
                    board,
                });
                return;
            } else {
                setBoard(playerId, boardMtxtoText(board), (error: unknown) => {
                    if (error) {
                        res.status(500).end();
                        return;
                    }
                    res.status(200).end();
                    return;
                });
            }
        })

    });
});


export default gameRoutes;
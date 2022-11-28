/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "crypto";
import { WebSocket } from "ws"
import { boardMtxtoText, validateBaord } from "../../util/board";
import { addPlayersToGame, createGame, getBoard, getGame, NewGameObject, setBoard } from "../database";
import { GameDAO, PlayerDAO } from "../database/types";

type playerQueueObject = {
    playerId: string,
    ws: WebSocket,
}

type InPlayObject = {
    gameId: string
    turn: number,   
    players: playerQueueObject[]
};


const inPlay: InPlayObject[] = [];
const playerQueue: playerQueueObject[] = [];

const handleJoinGame = (ws: WebSocket, message: any) => {
    if (message.type == 'join_game') {
        const playerId = randomUUID();
        playerQueue.push({ playerId, ws });

        if (playerQueue.length === 2) {
            const player1 = playerQueue.shift() as playerQueueObject;
            const player2 = playerQueue.shift() as playerQueueObject;
            const players = [player1, player2];
            const playerIds = players.map((player) => player.playerId)

            createGame((createError, newGame) => {

                try {
                    if (createError) {
                        throw createError;
                    }
                    const { gameId, turn } = newGame as NewGameObject;
                    addPlayersToGame(gameId as string, playerIds, ((addError) => {
                        if (addError) {
                            throw addError;
                        }
                        inPlay.push({
                            players,
                            gameId,
                            turn,
                        })
                        players.forEach((player) => {
                            player.ws.send(JSON.stringify({
                                type: "created_game",
                                payload: {
                                    playerId: player.playerId,
                                    gameId,
                                    turn,
                                },
                            }));
                        });
                    }))
                } catch (error) {
                    console.error(error)
                    players.forEach((player) => {
                        player.ws.send(JSON.stringify({
                            type: "failure",
                            payload: {
                                message: "failed to create game",
                            },
                        }));
                    })
                }
            });
        }
    }
}


const HandleSetBoard = (ws: WebSocket, message: any) => {
    const { playerId, gameId, board } = message
    if (!playerId || !gameId || !board) {
        ws.send(JSON.stringify({
            type: "failure",
            payload: {
                board,
                playerId,
                gameId,
                expected: "playerId, gameId, board"
            }
        }));
        return;
    }

    getGame(gameId, (error: unknown, game: GameDAO | null) => {
        if (error || !game) {
            ws.send(JSON.stringify({

                type: "failure",
                payload: `failed to locate game if id ${gameId}`
            }));
            return;
        }

        const players = JSON.parse(game.players);

        if (!players.includes(playerId)) {
            ws.send(JSON.stringify({
                type: "failure",
                payload: `player does not have access ${playerId}`
            }));
            return;
        }

        if (!validateBaord(board)) {
            ws.send(JSON.stringify({
                type: "failure",
                payload: `invalid Board ${board}`
            }));
            return;
        }
        getBoard(playerId, gameId, (error: unknown, row: PlayerDAO | null) => {
            console.table(row);
            if (error) {
                ws.send(JSON.stringify({
                    type: "failure",
                    payload: `invalid Board ${board}`
                }));
                return;
            }

            if (!row) {
                ws.send(JSON.stringify({
                    type: "failure",
                    payload: `invalid player ${playerId}`
                }));
                return;
            }
            if (row?.board) {

                ws.send(JSON.stringify({
                    type: "failure",
                    payload: 'board already set',
                }));
                return;
            } else {

                setBoard(playerId, boardMtxtoText(board), (error) => {
                    if (error) {
                        ws.send(JSON.stringify({
                            type: "failure",
                            payload: error,
                        }));
                        return;
                    }
                    ws.send(JSON.stringify({
                        type: "board_set",
                        payload: "success",
                    }));
                    let readyPlayers = 0
                    players.forEach((playerId: string) => {
                        getBoard(playerId, gameId, (_error, row) => {
                            if (row?.board) {
                                readyPlayers += 1
                            }
                        })

                        if (readyPlayers >= 2) {
                            ws.emit("game_ready")
                        }
                    })
                    return;
                });
            }
        })
    });
}

export {
    handleJoinGame,
    HandleSetBoard,
}
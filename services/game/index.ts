import { randomUUID } from "crypto";
import { WebSocketServer, WebSocket } from "ws"
import { boardMtxtoText, validateBaord } from "../../util/board";
import { createGame, getBoard, getGame, setBoard } from "../database";
import { GameDAO, PlayerDAO } from "../database/types";

const handleCreateGame = (ws: WebSocket, message: any) => {
    if (message.type == 'create_game') {
        const playerId = randomUUID();
        const gameId = randomUUID();
        const turn = (Math.floor(Math.random() * 10) % 2) + 1;
        createGame(playerId, gameId, turn, (result: any) => {
            if (result !== null) {
                console.log(result)
                ws.send(JSON.stringify({
                    type: "failure",
                    payload: {
                        message: "failed to create game",
                    },
                }));
            } else {
                ws.send(JSON.stringify({
                    type: "created_game",
                    payload: {
                        playerId,
                        gameId,
                        turn
                    },
                }));
            }
        })
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
    handleCreateGame,
    HandleSetBoard,
}
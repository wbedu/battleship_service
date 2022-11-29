/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "crypto";
import { WebSocket } from "ws"
import { boardMtxtoText, validateBoard } from "../../util/board";
import { addPlayersToGame, createGame, getBoard, getGame, NewGameObject, setBoard } from "../database";
import { GameDAO, PlayerDAO } from "../database/types";

type playerQueueObject = {
    playerId: string,
    ws: WebSocket,
    ships: number[][],
}

type InPlayObject = {
    gameId: string
    turn: number,
    players: playerQueueObject[]
};

type HitStatus = 'miss' | 'sank' | 'hit' | 'win' | 'lose';

const inPlay: InPlayObject[] = [];
const playerQueue: playerQueueObject[] = [];

const validateAccess = (game: InPlayObject | undefined, playerId: string | undefined) => {
    if (!game) {
        throw new Error("failed find game");
    }

    if (!game.players.some((player) => player.playerId === playerId)) {
        throw new Error("player does not have access to this game");
    }
}

const tileNameToIndex = (tileName: string) => Number(tileName.split('(')[1].split(')')[0]);

const isGameOver = (ships: number[][]) => ships.every(ship => ship.every((pos) => pos === -1))

const startGame = (players: playerQueueObject[]) => {
    const gameId = randomUUID();
    inPlay.push({
        players,
        gameId,
        turn: 1,
    });

    players.forEach((player, index) => {
        player.ws.send(JSON.stringify({
            type: "created_game",
            payload: {
                playerId: player.playerId,
                playerIndex: index + 1,
                gameId,
                turn: 1,
            },
        }));
    });
}

const handleJoinGame = (ws: WebSocket, message: any) => {
    if (message.type == 'join_game') {
        const playerId = randomUUID();
        playerQueue.push({ playerId, ws, ships: [] });
        console.table(playerQueue.map((player) => player.playerId))

        if (playerQueue.length >= 2) {
            while (playerQueue.length >= 2) {
                startGame(playerQueue.splice(0, 2));
            }
        }
    }
}

const handleSetShip = (ws: WebSocket, message: any) => {
    const { gameId, playerId, shipIndex, tiles } = message.payload;
    const game = inPlay.find((game) => game.gameId === gameId) as InPlayObject;
    validateAccess(game, playerId);
    const playerIndex = game.players.findIndex((player) => player.playerId === playerId) as number;
    game.players[playerIndex].ships[shipIndex] = tiles.map((tile: string) => tileNameToIndex(tile));
}

const HandleFire = (ws: WebSocket, message: any) => {
    const { gameId, playerId, tile } = message.payload;
    const game = inPlay.find((game) => game.gameId === gameId) as InPlayObject;
    validateAccess(game, playerId);

    const targetPlayer = game.players.find((player) => player.playerId !== playerId);

    if (!targetPlayer) {
        throw new Error("target player does not exist");
    }

    const pos = tileNameToIndex(tile);

    const attemptShipIndex = targetPlayer.ships.findIndex(ship => ship.includes(pos));
    game.turn = ((game.turn + 1) % 2) + 1
    let status: HitStatus;
    if (attemptShipIndex === -1) {
        status = 'miss';
    } else {
        const hitShip = targetPlayer.ships[attemptShipIndex];
        const attemptSpot = hitShip.findIndex((ship) => ship === pos)
        hitShip[attemptSpot] = -1;
        if (hitShip.every((ship) => ship === -1)) {
            status = 'sank';
            if (isGameOver(targetPlayer.ships)) {
                status = 'win'
            }
        } else {
            status = 'hit';
        }
    }

    targetPlayer.ws.send(JSON.stringify({
        type: "enemy_attack",
        payload: {
            pos,
            status: status === 'win' ? 'lose' : status,
            turn: game.turn
        },
    }));
    ws.send(JSON.stringify({
        type: "attack_result",
        payload: {
            pos,
            status,
            turn: game.turn
        },
    }));

    if (status === 'win') {
        const gameIndex = inPlay.findIndex((curGame) => curGame.gameId != game.gameId);
        inPlay.splice(gameIndex, 1);
    }

}

export {
    handleJoinGame,
    HandleFire,
    handleSetShip,
}
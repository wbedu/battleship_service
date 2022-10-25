import { Database } from 'sqlite3';

const db = new Database('./database.sqlite');
import { GameDAO, PlayerDAO } from './types'


db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS game(
        id STRING PRIMARY KEY,
        turn INTEGER,
        players string
    );`);

    db.run(`
    CREATE TABLE IF NOT EXISTS player(
        id STRING PRIMARY KEY,
        gameId String,
        board TEXT,
        FOREIGN KEY(gameId) REFERENCES game(id)
    );`);
});

// Prepared Statements
const createGameStmt = db.prepare('INSERT INTO game(id, turn, players) VALUES (?,?,?)');
const getGameStmt = db.prepare("SELECT * from game where id = ?");
const addPlayerStmt = db.prepare('UPDATE game SET players = ? WHERE id = ?');
const setBoardStmt = db.prepare("UPDATE player SET board = ? where id = ?");
const getPlayerBoardStmt = db.prepare('Select board from player where id = ? and gameId = ?');
const createPlayerStmt = db.prepare('INSERT INTO player VALUES(?,?,?)');

const createGame = (
    player1Id: string,
    gameId: string,
    turn: number,
    callback: (error: unknown | null) => void
) => {
    try {
        const players = JSON.stringify([player1Id]);
        db.serialize(() => {
            createGameStmt.run([gameId, turn, players])
            createPlayerStmt.run([player1Id, gameId, undefined])
        })
    }
    catch (error: unknown) {
        console.error(error);
        if (callback) {
            return callback(error);
        } else {
            throw error
        }
    }
    if (callback) {
        return callback(null);
    }
}

const getGame = (
    gameId: string,
    callback: (error: unknown, game: GameDAO | null) => void
) => getGameStmt.get([gameId], callback);

const addPlayerToGame = (
    gameId: string,
    players: string[],
    callback: (error: unknown) => void,
) => {
    try {
        db.serialize(() => {
            createPlayerStmt.run([players[1], gameId, undefined])
            addPlayerStmt.run(JSON.stringify(players), gameId);
        })
    }
    catch (error: unknown) {
        console.error(error);
        if (callback) {
            return callback(error);
        } else {
            throw error
        }
    }
    if (callback) {
        return callback(null);
    }
}
const getBoard = (
    playerId: string,
    gameId: string,
    callback: (error: unknown, row: PlayerDAO | null) => void,
) => getPlayerBoardStmt.get([playerId, gameId], callback);

const setBoard = (
    playerId: string,
    board: string,
    callback: (error: unknown) => void,
) => setBoardStmt.run([board, playerId], callback);

export {
    createGame,
    getGame,
    addPlayerToGame,
    setBoard,
    getBoard,
}

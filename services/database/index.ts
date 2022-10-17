import { Database } from 'sqlite3';

const db = new Database('./database.sqlite');
import { GameDAO } from './types'


db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS game (id STRING PRIMARY KEY, turn INTEGER, players string);');
    db.run(`
    CREATE TABLE IF NOT EXISTS player(
        id STRING PRIMARY KEY,
        gameId String, board TEXT,
        FOREIGN KEY(gameId) REFERENCES game(id)
    );`);
});

// Prepared Statements
const createGameStmt = db.prepare('INSERT INTO game(id, turn, players) VALUES (?,?,?)');
const getGameStmt = db.prepare("SELECT * from game where id = ?");
const addPlayerStmt = db.prepare('UPDATE game SET players = ? WHERE id = ?')
const getPlayerBoardStmt = db.prepare('Select board from player where id = ? and gameId = ?');
const createPlayerStmt = db.prepare('INSERT INTO player VALUES(?,?,?)');

const createGame = (
    player1Id: string,
    gameId: string,
    turn: number,
    callback: (error: unknown | null) => void
) => {
    try {

        db.serialize(() => {
            createGameStmt.run([gameId, turn, player1Id])
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
    callback: (game: GameDAO | null) => undefined
) => getGameStmt.get([gameId], callback);

const addPlayerToGame = (
    gameId: string,
    playerId: string,
    callback: (error: unknown) => void,
) => addPlayerStmt.run(playerId, gameId, callback);

const getBoard = (
    playerId: string,
    gameId: string,
    callback: (board: string[][] | null) => void,
) => getPlayerBoardStmt.get([playerId, gameId], callback);

export {
    createGame,
    getGame,
    addPlayerToGame,
    getBoard,
}
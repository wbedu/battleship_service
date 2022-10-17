import { Database } from "sqlite3";

let db = Database('./database.sqlite');

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
const addPlayerStmt = db.prepare('UPDATE game SET players = ? WHERE id = ?');
const getPlayerBoardStmt = db.prepare('Select board from player where id = ? and gameId = ?');
const createPlayerStmt = db.prepare('INSERT INTO player VALUES(?,?,?)');

// db stuffs
const createGame = (player1Id, gameId, turn, callback) => {
    try {
        db.serialize(() => {
            createGameStmt.run([gameId, turn, player1Id]);
            createPlayerStmt.run([player1Id, gameId, undefined]);
        });
    }
    catch (error) {
        callback(error);
    }
    callback(null);
};

const getGame = (gameId, callback) => getGameStmt.get([gameId], callback);
const addPlayerToGame = (gameId, playerId, callback) => addPlayerStmt.run(gameId, playerId, callback);
const getBoard = (playerId, gameId, callback) => getPlayerBoardStmt.get([playerId, gameId], callback);

export {
    createGame,
    getGame,
    addPlayerToGame,
    getBoard,
};
type GameDAO = {
    id: string,
    turn: number,
    players: string,
}

type PlayerDAO = {
    id: string,
    gameId: string,
    board: string
}

export {
    GameDAO,
    PlayerDAO,
}
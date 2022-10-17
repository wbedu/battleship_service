import { Router } from "express";

const gameRoutes = Router()

gameRoutes.get('/:gameId/', (req, res) => {
    const playerId = req.header('playerId');
    console.info(`move from playerId ${playerId}`)
    throw( new Error('Not implemented'));
}) 


export default gameRoutes;
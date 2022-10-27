import { Router } from "express";
import { setBoard, getGame, getBoard } from "../../services/database";
import { GameDAO, PlayerDAO } from "../../services/database/types";
import { validateBaord, boardMtxtoText } from "../../util/board";

const gameRoutes = Router()

gameRoutes.post('/setBoard/:gameId', (req, res) => {

});


export default gameRoutes;
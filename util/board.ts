const validateBoard = (board: string[][]) => {
    if (
        board.length !== 10
        || board.filter(
            (tileSet) => (tileSet.length != 10)).length !== 0
    ) {
        return false;
    }

    return true;
};

const boardTextToMtx = JSON.parse

const boardMtxtoText = JSON.stringify

export {
    validateBoard,
    boardTextToMtx,
    boardMtxtoText,
};
// Import the express in typescript file
import express from 'express';
import config from './config/config.json'

//routes
import gameRoutes from './routes/game';

// Initialize the express engine
const app: express.Application = express();
// Take a port 3000 for running server.
const port: number = config.PORT ?? 3000;

// Handling '/' Request
app.get('/', (_req, _res) => {
    _res.send("TypeScript With Express");
});

// Server setup
app.listen(port, () => {
    console.log(`TypeScript with Express
         http://localhost:${port}/`);
});

app.use('/game', gameRoutes)
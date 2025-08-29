import express from 'express';
import { main } from './localDb.js';
const app = express();

app.use(express.json());


app.get('/', async (req, res) => {
  res.send('Hello World!');
  await main();
});



app.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
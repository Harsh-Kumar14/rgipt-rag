import express from 'express';
import { main } from './localDb.js';
import { chatSchema } from './types.js';
import { chatCompletion } from './chatCompletion.js';
import type { messageSchema } from './types.js';
const app = express();

app.use(express.json());


app.get('/chat', async(req, res) => {
  const {success, data} = chatSchema.safeParse(req.body());

  if(!success) {
    res.status(411).json({
      message: "Invalid input",
    })
    return;
  }

  chatCompletion(data as messageSchema);
})
app.get('/', async (req, res) => {
  res.send('Hello World!');
  await main();
});



app.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
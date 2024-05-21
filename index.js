const express = require('express');
const app = express();
const cors = require('cors');
const execute_c = require('./execute_c');
const execute_cpp = require('./execute_cpp');
const execute_python = require('./execute_python');
const execute_java = require('./execute_java');
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/hello', (req, res) => {
  res.send({ ans: 'Hello World!' });
});

app.post('/submitcode', async (req, res) => {
  const { code, input, language, filename } = req.body;
  let response;

  try {
      switch(language) {
        case "c":
          response = await execute_c(code,input)
          break;
        case "cpp":
          response = await execute_cpp(code,input)
          break;
        case "python":
          response = await execute_python(code,input)
          break;
        case "java":
          response = await execute_java(code,input,filename)
          break;
        default:
          res.status(500).json({ error: 'Unexpected Input' });
    }
  } catch (error) {
  }
  res.send(response);
});

app.listen(process.env.PORT, () => {
  console.log(`App listening at http://localhost:${process.env.PORT}`);
});
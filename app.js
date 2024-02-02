import express from 'express';
import cookieParser from 'cookie-parser';
import usersRouter from './routers/users.router.js';
import docRouter from './routers/documents.router.js';

const app = express(); 
const PORT = 3019; 

app.use(express.json());
app.use(cookieParser());
app.use('/api', [usersRouter], [docRouter]);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
})
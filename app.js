import express from 'express';
import bodyParser from 'body-parser';
import userRouter from './routers/users.router.js';
import resumeRouter from './routers/resumes.router.js';
import authRouter from './routers/auth.router.js'

const app = express(); 
const PORT = 3019; 

app.use(bodyParser.json());
app.use(express.json());

app.use('/users', userRouter);
app.use('/resumes', resumeRouter);
app.use('/auth', authRouter);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
})
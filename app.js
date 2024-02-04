import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import userRouter from './routers/users.router.js';
import resumeRouter from './routers/resumes.router.js';

const app = express(); 
const PORT = 3019; 

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use('/users', userRouter);
app.use('/resumes', resumeRouter);


app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
})
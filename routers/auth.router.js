import express from 'express';
import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client'; 
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();

router.get('/tokens', async (req, res)=>{
  const {refreshToken} = req.body; 

  if(!refreshToken) {
    throw new Error('인증 정보가 올바르지 않습니다.')
  }

  const {tokenType, tokenValue} = refreshToken.split(" ");
  if(tokenType !== 'Bearer') {
    throw new Error('토큰 형식이 Bearer가 아닙니다.')
  }

  if(!tokenValue) {
    throw new Error('인증 정보가 올바르지 않습니다.')
  }

  const token = jwt.verify(tokenValue, process.env.REFRESH_TOKEN_KEY); //refreshToken 유효성 검사
  if (!token.userId) {
    return res.status(401).end();
  }

  const user = await prisma.users.findFirst({
    where: {
      userId: token.userId, //Users 테이블의 userId에서 token의 userId와 일치하는 값을 찾아라
    }
  })

  if(!user) {
    return res.status(401).end();
  }

  const newAccessToken = jwt.sign({userId: user.userId}, process.env.ACCESS_TOKEN_KEY, {expiresIn: '12h'});
  const newRefreshToken = jwt.sign({userId: user.userId}, process.env.REFRESH_TOKEN_KEY, {expiresIn: '7d'});

  return res.json({
    accessToken: newAccessToken, 
    refreshToken: newRefreshToken
  })
})



export default router;
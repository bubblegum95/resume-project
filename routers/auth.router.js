import express from 'express';
import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client'; 
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();

router.post('/tokens', async (req, res)=>{
  const {refreshToken} = req.body; 
  if (!refreshToken) {
    return res.status(401).json({message: "권한이 없습니다."});
  }

  const user = await prisma.users.findFirst({
    where: {
      userId: refreshToken.userId, //Users 테이블의 userId에서 token의 userId와 일치하는 값을 찾아라
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
import express from 'express';
import {usersPrisma} from '../models/users.model.js';
import AuthMiddleware from '../middlewares/need-sign-in.middleware.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Prisma } from "@prisma/client";

dotenv.config();

const usersRouter = express.Router(); // 라우터 생성

// 회원가입
usersRouter.post('/sign-up', async(req, res, next)=>{
  try{
  const {email, password, confirmPassword, name, gender, age} = req.body;
  const isExistUser = await usersPrisma.users.findFirst({
    where: {email}
  })

  if(isExistUser){
    return res.status(409).json({message: '이미 존재하는 이메일입니다.'})
  }


  if(password.length<5){
    return res.status(409).json({message: '비밀번호는 6자리 이상이어야 합니다.'})
  }

  if(confirmPassword !== password) {
    return res.status(409).json({message: '비밀번호가 일치하지 않습니다.'})
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const [user, userInfo] = await usersPrisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        email, 
        password: hashedPassword,
      }
    })
    const userInfo = await tx.userInfos.create({
      data:{
        userId: user.userId,
          name,
          age,
          gender,
        }
    });
    return [user, userInfo];
},{
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
})
return res.status(201).json({ message: '회원가입이 완료되었습니다.'});
}catch(err){
next(err);
}

})

// refresh token으로 access token 재발급
usersRouter.post('/sign-in/refresh', async(req, res) => {
  const {refresh_authorization} = req.cookies; 
  if(!refresh_authorization){
    return res.status(400).json({errorMessage: "Refresh Token이 존재하지 않습니다."});
  }

  const [tokenType, token] = refresh_authorization.split(' ');
  if (tokenType!=='Bearer') throw new Error('토큰 타입이 Bearer이 아닙니다.')

  const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY); // payload 확인
  if(!payload) throw new Error('Refresh Token이 정상적이지 않습니다.')

  const userId = payload.userId; 

  const user = await usersPrisma.users.findFirst({
    where: {userId: +userId}
  });

  if(!user) throw new Error('토큰 사용자가 존재하지 않습니다.');
  const newAccessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET_KEY, {expiresIn: '12h'});;

  res.cookie('access_authorization', `Bearer ${newAccessToken}`);
  return res.status(200).json({message: 'Access Token을 새롭게 발급했습니다.'});
}) 

// 로그인
usersRouter.post('/sign-in', async(req, res, next) => {
  const {email, password} = req.body; 

  const user = await usersPrisma.users.findFirst({where: {email}});

  if(!user) {
    return res.status(401).json({message: '존재하지 않는 이메일입니다.'});
  }
  if(!(await bcrypt.compare(password, user.password))){
    return res.status(401).json({message: '비밀번호가 일치하지 않습니다.'});
  }

  const accessToken = jwt.sign({userId: user.userId}, process.env.JWT_SECRET, {expiresIn: '12h'});
  const refreshToken = jwt.sign({userId: user.userId}, process.env.REFRESH_TOKEN_SECRET_KEY, {expiresIn: '7d'});

  res.cookie('authorization', `Bearer ${accessToken}`)
  res.cookie('refresh_authorization', `Bearer ${refreshToken}`)

  return res.status(200).json({message: '로그인에 성공하였습니다.'})
})


// 사용자 정보 조회 
usersRouter.get('/users/:userId', AuthMiddleware, async (req, res, next)=>{
  const {userId} = req.params;
  const user = await usersPrisma.users.findFirst({
    where: {
      userId: +userId
    }, 
    select: {
      email: true,
    }
  })
  const userInfo = await usersPrisma.userInfos.findFirst({
    where: {
      userId: +userId
    },
    select: {
      userInfoId: true, 
      userId: true, 
      name: true, 
      gender: true, 
      age: true, 
    }
  });
  return res.status(200).json({data: [user, userInfo]});
})

export default usersRouter;
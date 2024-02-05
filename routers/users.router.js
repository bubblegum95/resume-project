import express from 'express';
import jwtValidate from '../middlewares/need-sign-in.middleware.js'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import cryptoJS from 'crypto-js';

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();
const sha256 = cryptoJS.sha256;

// 회원가입
router.post('/sign-up', async (req, res) => {
  const {email, clientId, password, passwordConfirm, name} = req.body;

  // kakao auth을 하지 않은 경우
  if(!clientId){
    if (!email) {
      return res.status(400).json({success: false, message: "이메일을 필수입니다."})
    }
  
    if (!password) {
      return res.status(400).json({success: false, message: "비밀번호는 필수입니다."})
    }
    
    if (!passwordConfirm) {
      return res.status(400).json({success: false, message: "비밀번호 확인은 필수입니다."})
    }

    if (password.length < 6) {
      return res.status(400).json({success: false, message: "비밀번호는 최소 6자 이상입니다."})
    }
    
    if (password !== passwordConfirm) {
      return res.status(400).json({success: false, message: "비밀번호가 일치하지 않습니다."})
    }
  }
  
  
  if (!name) {
    return res.status(400).json({success: false, message: "이름은 필수입니다."})
  }
  
  if (clientId){
    // clientId (kakao)로 회원가입
    const user = await prisma.users.findFirst({
      where: {
        clientId,
      }
    })

    if(user){
      return res.status(400).json({success: false, message: "이미 가입된 사용자입니다."})
    }

    await prisma.users.create({
      data: {
        clientId,
        name,
      }
    })
  } else {
    //email로 회원가입
    const user = await prisma.users.findFirst({
      where: {
        email, 
      }
    })
  
    if (user) {
      return res.status(400).json({success: false, message: "이미 존재하는 이메일입니다."})
    }

    await prisma.users.create({
      data: {
        email,
        password: sha256(password).toString(), 
        name,
      }
    })
  }


  return res.status(201).json({
    email,
    name,
  })
})

// 로그인
router.post('/sign-in', async (req, res) => {
  const {clientId, email, password} = req.body;
  let user; 

  if(!clientId){
    user = await prisma.users.findFirst({
      where: {
        clientId,
      }
    })

    if (!user) {
      return res.status(401).json({success: false, message: "인증 정보가 정확하지 않습니다."})
    }
  } else {
    if (!email) {
      return res.status(400).json({success: false, message: "이메일을 필수입니다."})
    }
  
    if (!password) {
      return res.status(400).json({success: false, message: "비밀번호는 필수입니다."})
    }
  
    user = await prisma.users.findFirst({
      where: {
        email,
        password: sha256(password).toString(),
      }
    })

    if (!user) {
      return res.status(401).json({success: false, message: "이메일 또는 비밀번호가 정확하지 않습니다."})
    }
  }
  
  const accessToken = jwt.sign({userId: user.userId}, 'resume@@', {expiresIn: '12h'})
  return res.json({
    accessToken,
  })
})

// 내정보 조회
router.get('/me', jwtValidate, (req, res)=>{
  const user = res.locals.user;

  return res.json({
    email: user.email,
    name: user.name,
  })
})

export default router;
import express from 'express';
import jwtValidate from '../middlewares/need-sign-in.middleware.js'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client';
import sha256 from 'crypto-js/sha256.js';

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router();

// 회원가입
router.post('/sign-up', async (req, res) => {
  const {email, clientId, password, passwordConfirm, name, grade} = req.body;
  // 권한 부여
  if(grade && !['NORMAL', 'ADMIN'].includes(grade)) {
    return res.status(400).json({success: false, message: "등급이 올바르지 않습니다."})
  }

  if (!name) {
    return res.status(400).json({success: false, message: "이름은 필수입니다."})
  }

  // kakao auth을 하지 않은 경우
  if(!clientId){
    if (!email) {
      return res.status(400).json({success: false, message: "이메일은 필수입니다."})
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
        grade,
      }
    })
  } else {
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
        grade,
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
  // accessToken 발급
  const accessToken = jwt.sign({userId: user.userId}, process.env.ACCESS_TOKEN_KEY, {expiresIn: '12h'});
  const refreshToken = jwt.sign({userId: user.userId}, process.env.REFRESH_TOKEN_KEY, {expiresIn: '7d'});
  return res.json({
    accessToken,
    refreshToken,
  })
  
})

// 내정보 조회
router.get('/me', jwtValidate, (req, res)=>{
  const user = res.locals.user;

  return res.json({
    email: user.email,
    name: user.name,
    grade: user.grade,
  })
})

export default router;
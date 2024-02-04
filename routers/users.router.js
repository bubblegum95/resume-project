import express from 'express';
import jwtValidate from '../middlewares/need-sign-in.middleware.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client'; 

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router(); // 라우터 생성


// 회원가입
router.post('/sign-up', async (req, res) => {
  const {email, password, passwordConfirm, name} = req.body;
  if (!email) {
    return res.status(400).json({success: false, message: "이메일을 필수입니다."})
  }

  if (!password) {
    return res.status(400).json({success: false, message: "비밀번호는 필수입니다."})
  }

  if (!name) {
    return res.status(400).json({success: false, message: "이름은 필수입니다."})
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
      password, 
      name,
    }
  })

  return res.status(201).json({
    email,
    name,
  })
})

// 로그인
router.post('/sign-in', async (req, res) => {
  const {email, password} = req.body;
  if (!email) {
    return res.status(400).json({success: false, message: "이메일을 필수입니다."})
  }

  if (!password) {
    return res.status(400).json({success: false, message: "비밀번호는 필수입니다."})
  }

  const user = await prisma.users.findFirst({
    where: {
      email,
      password,
    }
  })

  if (!user) {
    return res.status(401).json({success: false, message: "이메일 또는 비밀번호가 올바르지 않습니다."})
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
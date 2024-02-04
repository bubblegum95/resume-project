import express from 'express';
import AuthMiddleware from '../middlewares/need-sign-in.middleware.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client'; 

dotenv.config();

const prisma = new PrismaClient();
const router = express.Router(); // 라우터 생성

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

  if (password !== passwordConfirm) {
    return res.status(400).json({success: false, message: "비밀번호가 일치하지 않습니다."})
  }

  const user = await prisma.user.findFirst({
    where: {
      email, 

    }
  })
})


export default router;
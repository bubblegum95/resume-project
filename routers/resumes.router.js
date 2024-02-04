import express from 'express';
import jwtValidate from '../middlewares/need-sign-in.middleware.js'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client'; 

const router = express.Router();
const prisma = PrismaClient();

// 이력서 목록 조회
router.get('/', async(req, res) =>{
  const orderKey = req.query.orderKey ?? 'resumeId';
  const orderValue = req.query.orderValue ?? 'desc';

  if(!['resumeId', 'status'].includes(orderKey.toLowerCase())) {
    return res.status(400).json({
      success: false, 
      message: "orderKey는 'resumeId' 또는 'status' 입니다."
    })
  }

  if(!['asc', 'desc'].includes(orderValue.toLowerCase())) {
    return res.status(400).json({
      success: false, 
      message: "orderValue는 'asc' 또는 'desc' 입니다."
    })
  }

  const resumes = await prisma.resumes.findMany({
    select: {
      resumeId: true,
      title: true, 
      content: true,
      user: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      [orderKey]: orderValue.toLowerCase(),
    }
  })
  
  resumes.forEach(resumes => {
    resumes.name = resumes.users.name; 
    delete resumes.user;
  });

  return res.json({data: resumes});
})

// 이력서 단건 조회
router.get('/', async(req, res) =>{
  const resumeId = req.params.resumeId;
  if(!resumeId) {
    return res.status(400).json({
      success: false, 
      message: "resumeId는 필수값입니다."
    })
  }

  const resume = await prisma.resumes.findFirst({
    where: {
      resumeId: Number(resumeId),
    },
    select: {
      resumeId: true,
      title: true, 
      content: true,
      user: {
        select: {
          name: true,
        }
      }, 
      createdAt: true,
    }
  })
  
  resume.forEach(resumes => {
    resumes.name = resumes.users.name; 
    delete resumes.user;
  });

  if(!resume) {
    return res.json({data: {}});
  }

  return res.json({data: resume});
})

router.post('/', jwtValidate, async(req, res)=>{
  const user = res.locals.user;
  
  const {title, content} = req.body; 
  if(!title) {
    return res.status(400).json({
      success: false, 
      message: '이력서 제목은 필수값 입니다.'
    })
  }

  if(!content) {
    return res.status(400).json({
      success: false, 
      message: '자기소개는 필수값 입니다.'
    })
  }

  await prisma.resume.create({
    data: {
      title, 
      content, 
      status: 'APPLY',
      userId: user.userId,
    }
  })

  return res.status(201).json({});
})


export default router;
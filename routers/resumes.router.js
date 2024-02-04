import express from 'express';
import jwtValidate from '../middlewares/need-sign-in.middleware.js'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {PrismaClient} from '@prisma/client'; 

const router = express.Router();
const prisma = PrismaClient();

//이력서 생성
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


export default router;
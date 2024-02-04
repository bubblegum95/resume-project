import express from 'express';
import {Prisma} from '../models/index.js'
import AuthMiddleware from '../middlewares/need-sign-in.middleware.js'

const router = express.Router();

//이력서 생성
docRouter.post('/resumes', AuthMiddleware, async (req, res) => {
  try {
    const {title, selfIntroduction} = req.body  
    const {userId} = req.user;
    console.log(userId);
    const resume = await Prisma.resumes.create({
      data: {
        userId: +userId,
        userInfoId: +userId,
        title: title, 
        selfIntroduction: selfIntroduction,
      }
    })
  
    return res.status(200).json({data: resume});
  } catch (err) {
    res.status(500).json({message: "서버에 문제가 있습니다."})
  }
})

//이력서 목록 조회
docRouter.get('/resumes', AuthMiddleware, async (req, res, next) => {
  const {userId} = req.query;
  const resumes = await Prisma.resumes.findMany({
    where: {
      userId: +userId,
    },
    select: {
      resumeId : true,
      userInfo: {
        select: {
          name: true,
        }
      },
      title: true, 
      createdAt: true,
      selfIntroduction: true,
      status: true
    }, 
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.status(200).json({data: resumes});
})

// 이력서 상세조회
docRouter.get('/resumes/:resumeId', AuthMiddleware, async(req, res, next)=>{
  const {resumeId}= req.params; 

  const resume = await Prisma.resumes.findFirst({
    where: {
      resumeId: +resumeId
    }, 
    select: {
      resumeId: true,
      title: true,
      userInfo: {
        select: {
          name: true,
        }
      },
      selfIntroduction: true, 
      createdAt: true,
      status: true, 
    }
  });

  return res.status(200).json({data: resume});
})

// 이력서 수정
docRouter.patch('/resumes/:resumeId', AuthMiddleware, async(req, res)=> {
  try {
    if(!req.body || !req.params) {
      return res.status(400).json({message: "이력서를 찾을 수 없습니다."})
    }

    const {resumeId} = req.params;
    const {title, selfIntroduction, status} = req.body;
    const updateResume = await Prisma.resumes.update({
      where: {
        resumeId: +resumeId
      },
      data: {
        title: title,
        selfIntroduction: selfIntroduction, 
        status: status, 
      },
      select: {
        resumeId: true,
        userInfo: {
          select: {
            name: true,
          }
        },
        title: true,
        selfIntroduction: true, 
        status: true,
        createdAt: true,
      }
    })

    return res.status(200).json({data: updateResume})
  } catch (err) {}
  res.status(400).json({message: "예기치 못한 에러가 발생하였습니다."});
})

// 이력서 삭제 

docRouter.delete("/resumes/:resumeId", AuthMiddleware, async(req, res)=>{
  try{
    if(!req.body || !req.params){
      return res.status(400).json({message: "이력서 조회에 실패하였습니다."});
    }
    
    const {resumeId} = req.params;
    const deleteResume = await Prisma.resumes.delete({
      where: {
        resumeId: +resumeId,
      }, 
      select: {
        resumeId: true,
      }
    }); 

    return res.status(200).json({date: deleteResume})
  } catch (err) {
    res.status(400).json({message: "예기치 못한 에러가 발생하였습니다."});
    if (err.code === 'P2025') {
      return res.status(404).json({ message: '해당 이력서를 찾을 수 없습니다.' });
    }
  }
}) 


export default docRouter;
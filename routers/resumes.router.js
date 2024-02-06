import express from 'express';
import jwtValidate from '../middlewares/need-sign-in.middleware.js'
import {PrismaClient} from '@prisma/client'; 

const router = express.Router();
const prisma = new PrismaClient();

// 이력서 목록 조회
router.get('/', async(req, res) =>{
  const orderKey = req.query.orderKey ?? 'resumeId';
  const orderValue = req.query.orderValue ?? 'desc';

  if(!['resumeId', 'status'].includes(orderKey)) {
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
      },
      createdAt: true,
    },
    orderBy: {
      [orderKey]: orderValue.toLowerCase(),
    }
  })
  
  resumes.forEach(resumes => {
    resumes.name = resumes.user.name; 
    delete resumes.user;
  });

  return res.json({data: resumes});
})

// 이력서 단건 조회
router.get('/:resumeId', async(req, res) =>{
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
  
  resume.name = resume.user.name; 
  delete resume.user;

  if(!resume) {
    return res.json({data: {}});
  }

  return res.json({data: resume});
})

// 이력서 작성 
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

  await prisma.resumes.create({
    data: {
      title, 
      content, 
      status: 'APPLY',
      userId: user.userId,
    }
  })

  return res.status(201).json({message: "이력서 작성을 완료하였습니다."});
})

// 이력서 수정 
router.patch('/:resumeId', jwtValidate, async (req, res)=>{
  const user = res.locals.user; 
  const resumeId = req.params.resumeId; 
  const {title, content, status} = req.body;

  if(!resumeId) {
    return res.status(400).json({
      success: false, 
      message: 'resumeId는 필수입니다.'
    })
  }

  if(!title) {
    return res.status(400).json({
      success: false, 
      message: '이력서 제목은 필수입니다.'
    })
  }

  if(!content) {
    return res.status(400).json({
      success: false, 
      message: '이력서의 자기소개는 필수입니다.'
    })
  }

  if(!status) {
    return res.status(400).json({
      success: false, 
      message: '이력서 상태는 필수입니다.'
    })
  }

  const resume = await prisma.resumes.findFirst({
    where: {
      resumeId: Number(resumeId),
    }
  });

  if(!resume) {
    return res.status(400).json({
      success: false, 
      message: '존재하지 않는 이력서입니다.'
    })
  }

  if((user.grade === 'NORMAL') && (user.userId !== resume.userId)) {
    return res.status(400).json({
      success: false, 
      message: '수정 권한이 없습니다.'
    })
  }

  if(!['APPLY', 'DROP', 'PASS', 'INTERVIEW1', 'INTERVIEW2', 'FINAL_PASS'].includes(status)) {
    return res.status(400).json({
      success: false, 
      message: '이력서 상태가 유효하지 않습니다.'
    })
  }

  await prisma.resumes.update({
    where: {
      resumeId: Number(resumeId), 
    }, 
    data: {
      title, 
      content, 
      status,
    }
  })

  return res.status(201).json({message: "이력서가 성공적으로 수정되었습니다."});
})

// 이력서 삭제 
router.delete('/:resumeId', jwtValidate, async(req, res)=>{
  const user = res.locals.user; 
  const resumeId = req.params.resumeId;

  if(!resumeId) {
    return res.status(400).json({
      success: false, 
      message: 'resumeId는 필수입니다.'
    })
  }

  const resume = await prisma.resumes.findFirst({
    where: {
      resumeId: Number(resumeId),
    }
  });

  if(!resume) {
    return res.status(400).json({
      success: false, 
      message: '존재하지 않는 이력서입니다.'
    })
  }

  if(resume.userId !== user.userId) {
    return res.status(400).json({
      success: false, 
      message: '삭제 권한이 없습니다.'
    })
  }

  await prisma.resumes.delete({
    where: {
      resumeId: Number(resumeId),
    }, 
  })

  return res.status(201).json({message: "이력서를 삭제하였습니다."});

})

export default router;
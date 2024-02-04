import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client'; 

const prisma = new PrismaClient();

const jwtValidate = async (req, res, next) => {
  try {
    // 헤더에서 accessToken 가져오기
    const accessToken = req.headers.authorization;
    if(!accessToken) {
      throw new Error('인증 정보가 올바르지 않습니다.')
    }

    // accessToken의 인증방식이 올바른가
    const {tokenType, tokenValue} = authorization.split(" ");
    if(tokenType !== 'Bearer') {
      throw new Error('인증 정보가 올바르지 않습니다.')
    }

    if(!tokenValue) {
      throw new Error('인증 정보가 올바르지 않습니다.')
    }

    // 12h이 남아있는가
    const token = jwt.verify(tokenValue, 'resume@@');

    // accessToken 안에 userId가 있는가?
    if(!token.userId) {
      throw new Error('인증 정보가 올바르지 않습니다.')
    }

    const user = await prisma.users.findFirst({
      where: {
        userId: token.userId
      }
    })

    // user 정보 담기
    res.locals.user = {};

    next();
  } catch (error) {
    return res.status(400).json({
      success: false, 
      message: error.message,
    })
  }
}

export default jwtValidate;
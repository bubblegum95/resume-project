import jwt from 'jsonwebtoken';
import {PrismaClient} from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const jwtValidate = async (req, res, next) => {
  try {
    // 헤더에서 accessToken 가져오기
    const authorization = req.headers.authorization;
    console.log(authorization);
    if(!authorization) {
      throw new Error('인증 정보가 없습니다.')
    }

    // accessToken의 인증방식이 올바른가
    const [tokenType, tokenValue] = authorization.split(" ");
    if(tokenType !== 'Bearer') {
      throw new Error('토큰 형식이 Bearer가 아닙니다.')
    }

    if(!tokenValue) {
      throw new Error('인증 정보가 올바르지 않습니다.')
    }

    // 12h이 남아있는가
    const token = jwt.verify(tokenValue, process.env.ACCESS_TOKEN_KEY);

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
    res.locals.user = user;

    next();
  } catch (error) {
    return res.status(400).json({
      success: false, 
      message: error.message,
    })
  }
}

export default jwtValidate;
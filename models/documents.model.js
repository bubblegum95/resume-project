import {PrismaClient} from '@prisma/client'; 

export const documentsPrisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], 

  errorFormat : 'pretty' 
}); 

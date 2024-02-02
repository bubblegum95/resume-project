// import {usersPrisma} from './users.model.js';
// import {documentsPrisma} from './documents.model.js';


// export {usersPrisma, documentsPrisma}
import {PrismaClient} from '@prisma/client'; 

export const Prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], 

  errorFormat : 'pretty' 
}); 

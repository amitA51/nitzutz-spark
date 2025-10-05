import { PrismaClient } from '@prisma/client';

// Create a single Prisma instance for the entire application
export const prisma = new PrismaClient();

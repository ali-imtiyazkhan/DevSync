import { prisma } from "@devsync/db";

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  return prisma.user.create({
    data: { name, email, password },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

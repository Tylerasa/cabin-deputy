import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName(),
        username: faker.internet.username(),
        phone: faker.phone.number(),
        pin: '1234',
        emailVerified: true,
        verificationToken: faker.string.nanoid(),
      },
    });

    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: faker.number.int({ min: 100, max: 10000 }),
      },
    });
  }
}

main()
  .catch((e) => {
    console.error('---', e);
    process.exit(1);
  })

  .finally(async () => {
    await prisma.$disconnect();
  });

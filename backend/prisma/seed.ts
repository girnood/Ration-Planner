import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { phone: '+96899999999' },
    update: {},
    create: {
      phone: '+96899999999',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('Created admin user:', admin);

  // Create sample customer
  const customer = await prisma.user.upsert({
    where: { phone: '+96812345678' },
    update: {},
    create: {
      phone: '+96812345678',
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });

  console.log('Created sample customer:', customer);

  // Create sample provider
  const provider = await prisma.user.upsert({
    where: { phone: '+96887654321' },
    update: {},
    create: {
      phone: '+96887654321',
      role: UserRole.PROVIDER,
      isActive: true,
      providerProfile: {
        create: {
          vehicleType: 'FLATBED',
          plateNumber: 'OMN-1234',
          status: 'APPROVED',
          currentLat: 23.614328,
          currentLng: 58.545284, // Muscat coordinates
          isOnline: false,
        },
      },
    },
  });

  console.log('Created sample provider:', provider);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

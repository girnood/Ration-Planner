import { PrismaClient, UserRole, ProviderStatus, VehicleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '+96812345678' },
    update: {},
    create: {
      phone: '+96812345678',
      name: 'Admin User',
      email: 'admin@munkith.om',
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.phone);

  // Create Test Customer
  const customer = await prisma.user.upsert({
    where: { phone: '+96887654321' },
    update: {},
    create: {
      phone: '+96887654321',
      name: 'Test Customer',
      email: 'customer@munkith.om',
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });
  console.log('✅ Test customer created:', customer.phone);

  // Create Test Provider (Approved)
  const provider1User = await prisma.user.upsert({
    where: { phone: '+96899001122' },
    update: {},
    create: {
      phone: '+96899001122',
      name: 'Ahmed Al-Balushi',
      email: 'ahmed@munkith.om',
      role: UserRole.PROVIDER,
      isActive: true,
    },
  });

  const provider1 = await prisma.provider.upsert({
    where: { userId: provider1User.id },
    update: {},
    create: {
      userId: provider1User.id,
      vehicleType: VehicleType.FLATBED,
      plateNumber: 'MSC-12345',
      status: ProviderStatus.APPROVED,
      isOnline: true,
      currentLat: 23.6100, // Muscat coordinates
      currentLng: 58.4059,
      licenseNumber: 'OM123456',
      vehicleModel: 'Ford F-550',
      vehicleYear: 2022,
    },
  });
  console.log('✅ Test provider 1 created:', provider1User.phone);

  // Create Another Test Provider (Approved)
  const provider2User = await prisma.user.upsert({
    where: { phone: '+96899112233' },
    update: {},
    create: {
      phone: '+96899112233',
      name: 'Mohammed Al-Harthy',
      email: 'mohammed@munkith.om',
      role: UserRole.PROVIDER,
      isActive: true,
    },
  });

  const provider2 = await prisma.provider.upsert({
    where: { userId: provider2User.id },
    update: {},
    create: {
      userId: provider2User.id,
      vehicleType: VehicleType.WHEEL_LIFT,
      plateNumber: 'MSC-67890',
      status: ProviderStatus.APPROVED,
      isOnline: true,
      currentLat: 23.5880, // Different location in Muscat
      currentLng: 58.3829,
      licenseNumber: 'OM789012',
      vehicleModel: 'Chevrolet Silverado',
      vehicleYear: 2023,
    },
  });
  console.log('✅ Test provider 2 created:', provider2User.phone);

  // Create Pending Provider (Needs Approval)
  const provider3User = await prisma.user.upsert({
    where: { phone: '+96899223344' },
    update: {},
    create: {
      phone: '+96899223344',
      name: 'Khalid Al-Rawahi',
      email: 'khalid@munkith.om',
      role: UserRole.PROVIDER,
      isActive: true,
    },
  });

  const provider3 = await prisma.provider.upsert({
    where: { userId: provider3User.id },
    update: {},
    create: {
      userId: provider3User.id,
      vehicleType: VehicleType.FLATBED,
      plateNumber: 'MSC-11111',
      status: ProviderStatus.PENDING,
      isOnline: false,
      licenseNumber: 'OM345678',
      vehicleModel: 'Toyota Hilux',
      vehicleYear: 2021,
    },
  });
  console.log('✅ Test provider 3 created (PENDING):', provider3User.phone);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

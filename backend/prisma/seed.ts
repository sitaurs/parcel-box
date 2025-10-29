import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default device
  const device = await prisma.device.upsert({
    where: { id: 'box-01' },
    update: {},
    create: {
      id: 'box-01',
      name: 'Smart Parcel Box #1',
      status: 'offline',
      fwVersion: 'v1.0.0',
    },
  });

  console.log('✅ Created device:', device.id);

  // Create admin user with secure password
  const adminPassword = 'Admin@2025';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartparcel.com' },
    update: {
      passHash: hashedPassword,
    },
    create: {
      email: 'admin@smartparcel.com',
      passHash: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ Created admin user:', admin.email);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Email:    admin@smartparcel.com');
  console.log('   Password: Admin@2025');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Script to change user role to ADMINISTRADOR
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function changeUserRole(email, newRole) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado: ${email}`);
      return;
    }

    console.log(`📋 Usuario actual:`, {
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      status: user.status,
    });

    const updated = await prisma.user.update({
      where: { email },
      data: { userType: newRole },
    });

    console.log(`✅ Rol actualizado exitosamente!`);
    console.log(`📋 Usuario actualizado:`, {
      email: updated.email,
      fullName: updated.fullName,
      userType: updated.userType,
      status: updated.status,
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];
const role = process.argv[3] || 'ADMINISTRADOR';

if (!email) {
  console.error('❌ Debes proporcionar un email');
  console.log('Uso: node change-user-role.js <email> [role]');
  console.log('Ejemplo: node change-user-role.js desarrollo@emooti.com ADMINISTRADOR');
  process.exit(1);
}

changeUserRole(email, role);

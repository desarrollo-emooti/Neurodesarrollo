import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@emooti.com' },
    update: {},
    create: {
      email: 'admin@emooti.com',
      fullName: 'Administrador EMOOTI',
      userType: 'ADMINISTRADOR',
      status: 'ACTIVE',
      active: true,
      phone: '+34 600 000 000',
      dni: '12345678A',
      birthDate: new Date('1990-01-01'),
      nationality: 'Española',
      address: 'Calle Ejemplo, 123',
      country: 'España',
      autonomousCommunity: 'Madrid',
      province: 'Madrid',
      city: 'Madrid',
      postalCode: '28001',
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample center
  const sampleCenter = await prisma.center.upsert({
    where: { code: 'CEN001' },
    update: {},
    create: {
      name: 'Centro Educativo de Prueba',
      code: 'CEN001',
      phone: '+34 900 000 000',
      email: 'info@centroprueba.com',
      responsable: 'María García López',
      type: 'publico',
      totalStudents: 500,
      address: 'Avenida de la Educación, 456',
      country: 'España',
      autonomousCommunity: 'Madrid',
      province: 'Madrid',
      city: 'Madrid',
      postalCode: '28002',
      active: true,
    },
  });

  console.log('✅ Sample center created:', sampleCenter.name);

  // Create sample orientador user
  const orientadorUser = await prisma.user.upsert({
    where: { email: 'orientador@centroprueba.com' },
    update: {},
    create: {
      email: 'orientador@centroprueba.com',
      fullName: 'Juan Pérez Martínez',
      userType: 'ORIENTADOR',
      status: 'ACTIVE',
      active: true,
      phone: '+34 600 000 001',
      dni: '87654321B',
      birthDate: new Date('1985-05-15'),
      nationality: 'Española',
      address: 'Calle del Profesor, 789',
      country: 'España',
      autonomousCommunity: 'Madrid',
      province: 'Madrid',
      city: 'Madrid',
      postalCode: '28003',
      centerId: sampleCenter.id,
      specialty: 'Orientación Educativa',
      licenseNumber: 'ORI123456',
    },
  });

  console.log('✅ Orientador user created:', orientadorUser.email);

  // Create sample clinica user
  const clinicaUser = await prisma.user.upsert({
    where: { email: 'clinica@emooti.com' },
    update: {},
    create: {
      email: 'clinica@emooti.com',
      fullName: 'Dra. Ana López Sánchez',
      userType: 'CLINICA',
      status: 'ACTIVE',
      active: true,
      phone: '+34 600 000 002',
      dni: '11223344C',
      birthDate: new Date('1980-03-20'),
      nationality: 'Española',
      address: 'Calle de la Clínica, 321',
      country: 'España',
      autonomousCommunity: 'Madrid',
      province: 'Madrid',
      city: 'Madrid',
      postalCode: '28004',
      centerIds: [sampleCenter.id],
      specialty: 'Psicología Clínica',
      licenseNumber: 'PSI789012',
    },
  });

  console.log('✅ Clínica user created:', clinicaUser.email);

  // Create sample family user
  const familyUser = await prisma.user.upsert({
    where: { email: 'familia@ejemplo.com' },
    update: {},
    create: {
      email: 'familia@ejemplo.com',
      fullName: 'Carlos García Ruiz',
      userType: 'FAMILIA',
      status: 'ACTIVE',
      active: true,
      phone: '+34 600 000 003',
      dni: '55667788D',
      birthDate: new Date('1988-07-10'),
      nationality: 'Española',
      address: 'Calle de la Familia, 654',
      country: 'España',
      autonomousCommunity: 'Madrid',
      province: 'Madrid',
      city: 'Madrid',
      postalCode: '28005',
    },
  });

  console.log('✅ Family user created:', familyUser.email);

  // Create sample student
  const sampleStudent = await prisma.student.create({
    data: {
      studentId: 'STU_001',
      nia: 'NIA123456789',
      fullName: 'María García Ruiz',
      phone: '+34 600 000 004',
      dni: '99887766E',
      birthDate: new Date('2015-09-15'),
      gender: 'F',
      nationality: 'Española',
      etapa: 'Educación Primaria',
      course: '3º Primaria',
      classGroup: '3ºA',
      centerId: sampleCenter.id,
      orientadorUserId: orientadorUser.id,
      disabilityDegree: 0,
      specialEducationalNeeds: 'Ninguna',
      medicalObservations: 'Sin observaciones médicas',
      generalObservations: 'Estudiante aplicada y responsable',
      consentGiven: 'Sí',
      paymentType: 'B2B2C',
      paymentStatus: 'Pagado',
      active: true,
    },
  });

  console.log('✅ Sample student created:', sampleStudent.fullName);

  // Create family relationship
  await prisma.studentFamilyRelation.create({
    data: {
      studentId: sampleStudent.id,
      familyUserId: familyUser.id,
      relationshipType: 'PADRE',
      isPrimaryContact: true,
      isEmergencyContact: true,
    },
  });

  console.log('✅ Family relationship created');

  // Create sample test assignment
  await prisma.testAssignment.create({
    data: {
      studentId: sampleStudent.id,
      testTitle: 'Evaluación Psicopedagógica Inicial',
      testLink: 'https://emooti.com/test/initial-evaluation',
      testDate: new Date('2024-02-15T10:00:00Z'),
      assignedBy: orientadorUser.id,
      assignedDate: new Date(),
      testStatus: 'Pendiente',
      consentGiven: 'Sí',
      priority: 'media',
      notes: 'Evaluación inicial para determinar necesidades educativas',
      active: true,
    },
  });

  console.log('✅ Sample test assignment created');

  // Create sample agenda event
  await prisma.agendaEvent.create({
    data: {
      title: 'Evaluación Psicopedagógica - María García',
      description: 'Evaluación inicial de María García Ruiz',
      eventType: 'evaluacion',
      centerId: sampleCenter.id,
      startDate: new Date('2024-02-15T10:00:00Z'),
      endDate: new Date('2024-02-15T12:00:00Z'),
      location: 'Aula de Evaluación 1',
      assignedExaminerId: clinicaUser.id,
      estimatedStudents: 1,
      testsToApply: [
        {
          name: 'Evaluación Psicopedagógica Inicial',
          examinerId: clinicaUser.id,
        },
      ],
      approvalStatus: 'aprobado',
      approvedBy: orientadorUser.id,
      approvalDate: new Date(),
      createdBy: orientadorUser.id,
      priority: 'media',
      recurring: false,
      active: true,
    },
  });

  console.log('✅ Sample agenda event created');

  // Create sample inventory item
  await prisma.inventoryItem.create({
    data: {
      code: 'INV001',
      name: 'Tablet iPad Pro 12.9"',
      category: 'Informatica',
      itemType: 'Tablet',
      inventoryNumber: 'TAB001',
      status: 'Libre',
      location: 'Aula de Evaluación 1',
      purchaseDate: new Date('2023-01-15'),
      serialNumber: 'IPAD123456789',
      stockControlEnabled: true,
      stock: 1,
      stockMinimo: 1,
      supplier: 'Apple España',
      supplierWebsite: 'https://www.apple.com/es/',
      supplierEmail: 'ventas@apple.com',
      supplierPhone: '+34 900 123 456',
      testType: 'link',
      requiresStaff: true,
      requiresTablet: true,
    },
  });

  console.log('✅ Sample inventory item created');

  // Create sample device
  await prisma.device.create({
    data: {
      name: 'iPad Pro 12.9" - Aula 1',
      type: 'ipad',
      serial: 'IPAD123456789',
      model: 'iPad Pro 12.9" (6th generation)',
      centerId: sampleCenter.id,
      location: 'Aula de Evaluación 1',
      status: 'activo',
      usageStatus: 'libre',
      lastStatusUpdate: new Date(),
      inventoryItemId: (await prisma.inventoryItem.findFirst({ where: { code: 'INV001' } }))?.id,
    },
  });

  console.log('✅ Sample device created');

  // Create sample company configuration
  await prisma.companyConfiguration.create({
    data: {
      companyName: 'EMOOTI Hub SL',
      cif: 'B12345678',
      address: 'Calle de la Innovación, 123',
      phone: '+34 900 000 000',
      email: 'info@emooti.com',
      postalCode: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'España',
      website: 'https://emooti.com',
      bankAccount: 'ES1234567890123456789012',
      invoiceSeries: 'EMO',
      creditNoteSeries: 'EMO-NC',
      lastInvoiceNumber: 0,
      lastCreditNoteNumber: 0,
      seriesYear: 2024,
      isActive: true,
    },
  });

  console.log('✅ Company configuration created');

  // Create sample value configuration
  await prisma.valueConfiguration.create({
    data: {
      testTitle: 'Evaluación Psicopedagógica Inicial',
      rules: [
        {
          minValue: 0,
          maxValue: 25,
          valuation: 'muy_bajo',
          color: '#ef4444',
        },
        {
          minValue: 26,
          maxValue: 40,
          valuation: 'bajo',
          color: '#f97316',
        },
        {
          minValue: 41,
          maxValue: 60,
          valuation: 'medio',
          color: '#eab308',
        },
        {
          minValue: 61,
          maxValue: 80,
          valuation: 'alto',
          color: '#22c55e',
        },
        {
          minValue: 81,
          maxValue: 100,
          valuation: 'muy_alto',
          color: '#10b981',
        },
      ],
    },
  });

  console.log('✅ Value configuration created');

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Created data:');
  console.log('- 1 Admin user (admin@emooti.com)');
  console.log('- 1 Orientador user (orientador@centroprueba.com)');
  console.log('- 1 Clínica user (clinica@emooti.com)');
  console.log('- 1 Family user (familia@ejemplo.com)');
  console.log('- 1 Sample center');
  console.log('- 1 Sample student');
  console.log('- 1 Family relationship');
  console.log('- 1 Test assignment');
  console.log('- 1 Agenda event');
  console.log('- 1 Inventory item');
  console.log('- 1 Device');
  console.log('- 1 Company configuration');
  console.log('- 1 Value configuration');
  console.log('');
  console.log('🔑 Default passwords: admin123 (for all users)');
  console.log('⚠️  Please change passwords in production!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

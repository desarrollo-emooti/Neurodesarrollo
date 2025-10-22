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
      password: hashedPassword,
      passwordSet: true,
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
      type: 'PUBLICO',
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
  const orientadorPassword = await bcrypt.hash('orientador123', 12);
  const orientadorUser = await prisma.user.upsert({
    where: { email: 'orientador@centroprueba.com' },
    update: {},
    create: {
      email: 'orientador@centroprueba.com',
      password: orientadorPassword,
      passwordSet: true,
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
  const clinicaPassword = await bcrypt.hash('clinica123', 12);
  const clinicaUser = await prisma.user.upsert({
    where: { email: 'clinica@emooti.com' },
    update: {},
    create: {
      email: 'clinica@emooti.com',
      password: clinicaPassword,
      passwordSet: true,
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
  const familyPassword = await bcrypt.hash('familia123', 12);
  const familyUser = await prisma.user.upsert({
    where: { email: 'familia@ejemplo.com' },
    update: {},
    create: {
      email: 'familia@ejemplo.com',
      password: familyPassword,
      passwordSet: true,
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
      etapa: 'EDUCACION_PRIMARIA',
      course: '3º Primaria',
      classGroup: '3ºA',
      centerId: sampleCenter.id,
      orientadorUserId: orientadorUser.id,
      disabilityDegree: 0,
      specialEducationalNeeds: 'Ninguna',
      medicalObservations: 'Sin observaciones médicas',
      generalObservations: 'Estudiante aplicada y responsable',
      consentGiven: 'SI',
      paymentType: 'B2B2C',
      paymentStatus: 'PAGADO',
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
      testStatus: 'PENDIENTE',
      consentGiven: 'SI',
      priority: 'MEDIA',
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
      eventType: 'EVALUACION',
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
      approvalStatus: 'APPROVED',
      approvedBy: orientadorUser.id,
      approvalDate: new Date(),
      createdBy: orientadorUser.id,
      priority: 'MEDIA',
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
      category: 'INFORMATICA',
      itemType: 'Tablet',
      inventoryNumber: 'TAB001',
      status: 'LIBRE',
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
      testType: 'LINK',
      requiresStaff: true,
      requiresTablet: true,
    },
  });

  console.log('✅ Sample inventory item created');

  // Create sample device
  const inventoryItem = await prisma.inventoryItem.findFirst({ where: { code: 'INV001' } });
  await prisma.device.create({
    data: {
      name: 'iPad Pro 12.9" - Aula 1',
      type: 'IPAD',
      serial: 'IPAD123456789',
      model: 'iPad Pro 12.9" (6th generation)',
      centerId: sampleCenter.id,
      location: 'Aula de Evaluación 1',
      status: 'ACTIVO',
      usageStatus: 'LIBRE',
      lastStatusUpdate: new Date(),
      inventoryItemId: inventoryItem?.id || null,
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

  // Create sample EmotiTests
  const emotiTest1 = await prisma.emotiTest.upsert({
    where: { code: 'BAT-SCR-001' },
    update: {},
    create: {
      code: 'BAT-SCR-001',
      name: 'Batelle SCR - Escala de Cribado',
      description: 'Escala de cribado para evaluación del desarrollo en edades tempranas',
      category: 'Desarrollo Temprano',
      testType: 'BATELLE_SCR',
      ageRangeMin: 0,
      ageRangeMax: 8,
      duration: 30,
      configuration: {
        sections: ['Personal/Social', 'Adaptativo', 'Motor', 'Comunicación', 'Cognitivo'],
        scoring: 'percentile',
        cutoffScore: 25,
      },
      version: '1.0',
      isActive: true,
      requiresTablet: true,
      requiresInternet: true,
      createdBy: adminUser.id,
      lastModified: new Date(),
    },
  });

  const emotiTest2 = await prisma.emotiTest.upsert({
    where: { code: 'CL-001' },
    update: {},
    create: {
      code: 'CL-001',
      name: 'Circuito Logopedia - Evaluación Completa',
      description: 'Evaluación integral de habilidades logopédicas: articulación, fluencia, vocabulario y comprensión',
      category: 'Logopedia',
      testType: 'CIRCUITO_LOGOPEDIA',
      ageRangeMin: 3,
      ageRangeMax: 12,
      duration: 45,
      configuration: {
        sections: ['Articulación', 'Fluencia', 'Vocabulario', 'Comprensión'],
        scoring: 'raw_score',
        passingScore: 60,
      },
      version: '1.0',
      isActive: true,
      requiresTablet: true,
      requiresInternet: true,
      createdBy: adminUser.id,
      lastModified: new Date(),
    },
  });

  const emotiTest3 = await prisma.emotiTest.upsert({
    where: { code: 'CS-001' },
    update: {},
    create: {
      code: 'CS-001',
      name: 'Circuito Sensoriomotor - Desarrollo Psicomotor',
      description: 'Evaluación del desarrollo sensoriomotor: motricidad gruesa, motricidad fina, coordinación y percepción',
      category: 'Psicomotricidad',
      testType: 'CIRCUITO_SENSORIOMOTOR',
      ageRangeMin: 2,
      ageRangeMax: 10,
      duration: 40,
      configuration: {
        sections: ['Motricidad Gruesa', 'Motricidad Fina', 'Coordinación', 'Percepción'],
        scoring: 'standard_score',
        mean: 100,
        sd: 15,
      },
      version: '1.0',
      isActive: true,
      requiresTablet: true,
      requiresInternet: true,
      createdBy: adminUser.id,
      lastModified: new Date(),
    },
  });

  const emotiTest4 = await prisma.emotiTest.upsert({
    where: { code: 'E2P-001' },
    update: {},
    create: {
      code: 'E2P-001',
      name: 'E2P - Evaluación de Procesos Cognitivos',
      description: 'Evaluación de atención, memoria, funciones ejecutivas y velocidad de procesamiento',
      category: 'Procesos Cognitivos',
      testType: 'E2P',
      ageRangeMin: 6,
      ageRangeMax: 16,
      duration: 50,
      configuration: {
        sections: ['Atención', 'Memoria', 'Funciones Ejecutivas', 'Velocidad de Procesamiento'],
        scoring: 'percentile',
        normGroup: 'edad',
      },
      version: '1.0',
      isActive: true,
      requiresTablet: true,
      requiresInternet: true,
      createdBy: adminUser.id,
      lastModified: new Date(),
    },
  });

  const emotiTest5 = await prisma.emotiTest.upsert({
    where: { code: 'BAT-SCR-002' },
    update: {},
    create: {
      code: 'BAT-SCR-002',
      name: 'Batelle SCR - Versión Extendida',
      description: 'Versión extendida de la escala de cribado Batelle para evaluación más detallada',
      category: 'Desarrollo Temprano',
      testType: 'BATELLE_SCR',
      ageRangeMin: 0,
      ageRangeMax: 12,
      duration: 60,
      configuration: {
        sections: ['Personal/Social', 'Adaptativo', 'Motor', 'Comunicación', 'Cognitivo'],
        scoring: 'percentile',
        cutoffScore: 25,
        extended: true,
      },
      version: '2.0',
      isActive: true,
      requiresTablet: true,
      requiresInternet: true,
      createdBy: adminUser.id,
      lastModified: new Date(),
    },
  });

  console.log('✅ EmotiTests created:', {
    batelleSCR: emotiTest1.code,
    circuitoLogopedia: emotiTest2.code,
    circuitoSensoriomotor: emotiTest3.code,
    e2p: emotiTest4.code,
    batelleExtended: emotiTest5.code,
  });

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
  console.log('- 5 EmotiTests (Batelle SCR, Circuito Logopedia, Circuito Sensoriomotor, E2P)');
  console.log('');
  console.log('🔑 Default credentials:');
  console.log('  - admin@emooti.com / admin123');
  console.log('  - orientador@centroprueba.com / orientador123');
  console.log('  - clinica@emooti.com / clinica123');
  console.log('  - familia@ejemplo.com / familia123');
  console.log('');
  console.log('⚠️  Please change these passwords in production!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

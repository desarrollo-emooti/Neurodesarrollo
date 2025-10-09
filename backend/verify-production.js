#!/usr/bin/env node

/**
 * Script de verificación para despliegue en producción
 * Verifica que todos los archivos y configuraciones estén correctos
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de producción...\n');

const errors = [];
const warnings = [];
const success = [];

// 1. Verificar que exista package.json
console.log('📦 Verificando package.json...');
if (fs.existsSync('./package.json')) {
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  if (pkg.scripts && pkg.scripts.start) {
    success.push('✅ Script "start" encontrado: ' + pkg.scripts.start);
  } else {
    errors.push('❌ Falta script "start" en package.json');
  }

  if (pkg.scripts && pkg.scripts.build) {
    success.push('✅ Script "build" encontrado: ' + pkg.scripts.build);
  } else {
    errors.push('❌ Falta script "build" en package.json');
  }

  if (pkg.main) {
    success.push('✅ Main entry point: ' + pkg.main);
  } else {
    warnings.push('⚠️  No se especifica "main" en package.json');
  }
} else {
  errors.push('❌ No se encontró package.json');
}

// 2. Verificar Dockerfile
console.log('\n🐋 Verificando Dockerfile...');
if (fs.existsSync('./Dockerfile')) {
  const dockerfile = fs.readFileSync('./Dockerfile', 'utf8');

  if (dockerfile.includes('npm run build')) {
    success.push('✅ Dockerfile ejecuta "npm run build"');
  } else {
    warnings.push('⚠️  Dockerfile no ejecuta "npm run build"');
  }

  if (dockerfile.includes('npm start')) {
    success.push('✅ Dockerfile ejecuta "npm start"');
  } else {
    errors.push('❌ Dockerfile no ejecuta "npm start"');
  }

  if (dockerfile.includes('npx prisma generate')) {
    success.push('✅ Dockerfile genera Prisma client');
  } else {
    errors.push('❌ Dockerfile no genera Prisma client');
  }

  if (dockerfile.includes('EXPOSE 3000')) {
    success.push('✅ Puerto 3000 expuesto');
  } else {
    warnings.push('⚠️  Puerto 3000 no expuesto explícitamente');
  }
} else {
  errors.push('❌ No se encontró Dockerfile');
}

// 3. Verificar estructura de directorios
console.log('\n📁 Verificando estructura de directorios...');
const requiredDirs = ['src', 'prisma'];
requiredDirs.forEach(dir => {
  if (fs.existsSync(`./${dir}`)) {
    success.push(`✅ Directorio "${dir}" encontrado`);
  } else {
    errors.push(`❌ Directorio "${dir}" no encontrado`);
  }
});

// 4. Verificar archivos críticos
console.log('\n📄 Verificando archivos críticos...');
const requiredFiles = [
  'src/index.ts',
  'prisma/schema.prisma',
  'tsconfig.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(`./${file}`)) {
    success.push(`✅ Archivo "${file}" encontrado`);
  } else {
    errors.push(`❌ Archivo "${file}" no encontrado`);
  }
});

// 5. Verificar prisma schema
console.log('\n🔷 Verificando Prisma schema...');
if (fs.existsSync('./prisma/schema.prisma')) {
  const schema = fs.readFileSync('./prisma/schema.prisma', 'utf8');

  if (schema.includes('provider = "postgresql"')) {
    success.push('✅ Provider PostgreSQL configurado');
  } else {
    errors.push('❌ Provider PostgreSQL no configurado');
  }

  if (schema.includes('env("DATABASE_URL")')) {
    success.push('✅ DATABASE_URL variable configurada en schema');
  } else {
    errors.push('❌ DATABASE_URL no configurada en schema');
  }
} else {
  errors.push('❌ No se encontró prisma/schema.prisma');
}

// 6. Verificar tsconfig.json
console.log('\n⚙️  Verificando TypeScript config...');
if (fs.existsSync('./tsconfig.json')) {
  const tsconfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));

  if (tsconfig.compilerOptions && tsconfig.compilerOptions.outDir) {
    success.push(`✅ Output directory: ${tsconfig.compilerOptions.outDir}`);
  } else {
    warnings.push('⚠️  No se especifica outDir en tsconfig.json');
  }
} else {
  errors.push('❌ No se encontró tsconfig.json');
}

// 7. Verificar si existe dist/ (después de build)
console.log('\n🏗️  Verificando build...');
if (fs.existsSync('./dist')) {
  success.push('✅ Directorio "dist" encontrado (build existente)');
  if (fs.existsSync('./dist/index.js')) {
    success.push('✅ index.js compilado encontrado');
  } else {
    warnings.push('⚠️  index.js no encontrado en dist/');
  }
} else {
  warnings.push('⚠️  Directorio "dist" no encontrado (ejecuta "npm run build")');
}

// 8. Verificar variables de entorno requeridas
console.log('\n🔐 Variables de entorno requeridas para App Runner:');
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
  'FRONTEND_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL'
];

console.log('\n📋 Checklist de variables de entorno:');
requiredEnvVars.forEach(envVar => {
  console.log(`   [ ] ${envVar}`);
});

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(60));

if (success.length > 0) {
  console.log('\n✅ CORRECTO (' + success.length + '):');
  success.forEach(msg => console.log('   ' + msg));
}

if (warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS (' + warnings.length + '):');
  warnings.forEach(msg => console.log('   ' + msg));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORES (' + errors.length + '):');
  errors.forEach(msg => console.log('   ' + msg));
}

console.log('\n' + '='.repeat(60));

if (errors.length === 0) {
  console.log('✅ Configuración lista para desplegar en AWS App Runner');
  console.log('\n📝 IMPORTANTE:');
  console.log('   1. Asegúrate de configurar TODAS las variables de entorno en App Runner');
  console.log('   2. Verifica que DATABASE_URL sea accesible desde AWS');
  console.log('   3. Espera 5-10 minutos para el primer despliegue');
  process.exit(0);
} else {
  console.log('❌ Hay errores que deben corregirse antes de desplegar');
  console.log('\n💡 Corrígelos y vuelve a ejecutar este script');
  process.exit(1);
}

#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import process from 'node:process';
import { listFeatureFlags, updateFeatureFlag, refreshFeatureFlags } from '../src/services/featureFlags.js';

const prisma = new PrismaClient();

const usage = () => {
  console.log('Usage: node scripts/featureFlags.js <command> [options]');
  console.log('Commands:');
  console.log('  list                         Listeyi yazdırır');
  console.log('  enable <key>                Belirtilen flagi aktif eder');
  console.log('  disable <key>               Belirtilen flagi pasif eder');
  console.log('  set <key> <0|1>             Belirtilen flag değerini atar');
};

const run = async () => {
  const [command, key, value] = process.argv.slice(2);

  if (!command || command === 'help' || command === '--help') {
    usage();
    process.exit(0);
  }

  switch (command) {
    case 'list': {
      await refreshFeatureFlags({ force: true });
      const flags = await listFeatureFlags();
      console.table(flags.map(({ key: flagKey, enabled, rolloutStatus }) => ({
        key: flagKey,
        enabled,
        rolloutStatus: rolloutStatus ?? '—'
      })));
      break;
    }
    case 'enable':
    case 'disable': {
      if (!key) {
        console.error('Bir flag anahtarı belirtmelisiniz.');
        usage();
        process.exit(1);
      }
      const enabled = command === 'enable';
      await updateFeatureFlag({ key, enabled });
      console.log(`Feature flag ${key} ${enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}.`);
      break;
    }
    case 'set': {
      if (!key || typeof value === 'undefined') {
        console.error('set komutu için <key> ve <0|1> değerini belirtmelisiniz.');
        usage();
        process.exit(1);
      }
      const enabled = value === '1' || value.toLowerCase() === 'true';
      await updateFeatureFlag({ key, enabled });
      console.log(`Feature flag ${key} ${enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}.`);
      break;
    }
    default:
      console.error(`Bilinmeyen komut: ${command}`);
      usage();
      process.exit(1);
  }
};

run()
  .catch((error) => {
    console.error('Komut çalıştırılırken hata oluştu:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

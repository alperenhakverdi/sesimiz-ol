#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

/**
 * Remove Debug Logs Script
 *
 * This script removes console.log statements from production builds
 * while preserving error logging and important operational logs.
 */

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Patterns to keep (important logs)
const keepPatterns = [
  /console\.error/,
  /console\.warn/,
  /console\.info.*Server running/,
  /console\.info.*Health check/,
  /console\.info.*API docs/,
  /console\.info.*WebSocket server/,
  /console\.log.*🚀/,
  /console\.log.*📊/,
  /console\.log.*📚/,
  /console\.log.*🔌/,
  /console\.log.*Email would be sent/, // Development email simulation
];

// Patterns to remove (debug logs)
const removePatterns = [
  /^\s*console\.log\([^)]*\);?\s*$/,
  /console\.log\(/,
  /console\.debug\(/,
  /console\.trace\(/,
];

function shouldKeepLine(line) {
  // Keep lines that match important patterns
  return keepPatterns.some(pattern => pattern.test(line));
}

function shouldRemoveLine(line) {
  // Remove lines that match debug patterns but not keep patterns
  if (shouldKeepLine(line)) {
    return false;
  }
  return removePatterns.some(pattern => pattern.test(line));
}

function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let removedCount = 0;
    let keptCount = 0;

    const processedLines = lines.map(line => {
      if (shouldRemoveLine(line)) {
        removedCount++;
        // Replace with empty line to maintain line numbers for debugging
        return '';
      } else if (line.includes('console.log')) {
        keptCount++;
      }
      return line;
    });

    // Remove trailing empty lines
    while (processedLines.length > 0 && processedLines[processedLines.length - 1] === '') {
      processedLines.pop();
    }

    if (removedCount > 0) {
      writeFileSync(filePath, processedLines.join('\n'));
      log(`  ✅ ${filePath.replace(process.cwd(), '.')}: removed ${removedCount} debug logs, kept ${keptCount} important logs`, 'green');
    }

    return { removed: removedCount, kept: keptCount };
  } catch (error) {
    log(`  ❌ Error processing ${filePath}: ${error.message}`, 'red');
    return { removed: 0, kept: 0 };
  }
}

async function main() {
  log(`${colors.bold}${colors.blue}🔒 Security Hardening: Removing Debug Logs${colors.reset}\n`);

  // Find all JavaScript files in src directory
  const files = await glob('src/**/*.js', { ignore: ['src/**/*.test.js', 'src/**/*.spec.js'] });

  if (files.length === 0) {
    log('No JavaScript files found in src directory', 'yellow');
    return;
  }

  log(`Processing ${files.length} files...\n`);

  let totalRemoved = 0;
  let totalKept = 0;

  for (const file of files) {
    const result = processFile(file);
    totalRemoved += result.removed;
    totalKept += result.kept;
  }

  log(`\n${colors.bold}${colors.green}✅ Debug log cleanup completed!${colors.reset}`);
  log(`Total debug logs removed: ${totalRemoved}`);
  log(`Important logs preserved: ${totalKept}`);

  if (totalRemoved > 0) {
    log(`\n${colors.yellow}⚠️  Remember to test your application after removing debug logs!${colors.reset}`);
  }
}

main().catch(error => {
  log(`Script failed: ${error.message}`, 'red');
  process.exit(1);
});
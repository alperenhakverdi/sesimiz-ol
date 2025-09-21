#!/usr/bin/env node

/**
 * Frontend Bundle Analyzer
 * Analyzes bundle size, loading performance, and identifies optimization opportunities
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FrontendBundleAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../');
    this.frontendPath = path.join(this.projectRoot, 'frontend');
    this.buildPath = path.join(this.frontendPath, 'dist');
    this.analysis = {
      timestamp: new Date().toISOString(),
      bundleSize: {},
      assetAnalysis: {},
      loadingPerformance: {},
      dependencies: {},
      recommendations: []
    };
  }

  async analyzeBundleSize() {
    console.log('📦 Analyzing bundle size...');

    try {
      // Build the project first
      console.log('   Building project...');
      await execAsync('npm run build', { cwd: this.frontendPath });

      // Analyze build output
      const buildStats = await this.getBuildStats();
      const assetSizes = await this.getAssetSizes();

      this.analysis.bundleSize = {
        ...buildStats,
        assets: assetSizes,
        totalSize: assetSizes.reduce((sum, asset) => sum + asset.size, 0)
      };

      console.log(`   ✅ Total bundle size: ${this.formatBytes(this.analysis.bundleSize.totalSize)}`);

      // Analyze individual chunks
      const chunks = assetSizes.filter(asset => asset.name.endsWith('.js'));
      chunks.forEach(chunk => {
        if (chunk.size > 1024 * 1024) { // > 1MB
          console.log(`   ⚠️  Large chunk detected: ${chunk.name} (${this.formatBytes(chunk.size)})`);
        }
      });

    } catch (error) {
      console.error('   ❌ Build analysis failed:', error.message);
      this.analysis.bundleSize.error = error.message;
    }
  }

  async getBuildStats() {
    try {
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      // Get build command output (Vite build stats)
      const { stdout } = await execAsync('npm run build 2>&1 | tail -20', { cwd: this.frontendPath });

      return {
        buildTool: 'Vite',
        buildCommand: packageJson.scripts?.build || 'unknown',
        buildOutput: stdout
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getAssetSizes() {
    const assets = [];

    try {
      const distExists = await fs.access(this.buildPath).then(() => true).catch(() => false);
      if (!distExists) {
        return assets;
      }

      const files = await this.getAllFiles(this.buildPath);

      for (const file of files) {
        const stats = await fs.stat(file);
        const relativePath = path.relative(this.buildPath, file);

        assets.push({
          name: relativePath,
          path: file,
          size: stats.size,
          type: this.getFileType(file),
          gzipSize: await this.estimateGzipSize(file)
        });
      }

      return assets.sort((a, b) => b.size - a.size);
    } catch (error) {
      console.error('   Error getting asset sizes:', error.message);
      return assets;
    }
  }

  async getAllFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.js': 'JavaScript',
      '.css': 'CSS',
      '.html': 'HTML',
      '.woff': 'Font',
      '.woff2': 'Font',
      '.ttf': 'Font',
      '.eot': 'Font',
      '.svg': 'SVG',
      '.png': 'Image',
      '.jpg': 'Image',
      '.jpeg': 'Image',
      '.gif': 'Image',
      '.webp': 'Image',
      '.ico': 'Icon',
      '.json': 'Data',
      '.map': 'Source Map'
    };

    return typeMap[ext] || 'Other';
  }

  async estimateGzipSize(filePath) {
    try {
      // Simple estimation: gzipped size is typically 30-70% of original for text files
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();

      if (['.js', '.css', '.html', '.json', '.svg'].includes(ext)) {
        return Math.round(stats.size * 0.35); // Estimate 35% compression
      }

      return stats.size; // No compression for binary files
    } catch (error) {
      return 0;
    }
  }

  async analyzeDependencies() {
    console.log('📚 Analyzing dependencies...');

    try {
      const packageJsonPath = path.join(this.frontendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      // Analyze package sizes
      const dependencyAnalysis = await this.analyzeDependencySizes(dependencies);

      this.analysis.dependencies = {
        production: Object.keys(dependencies).length,
        development: Object.keys(devDependencies).length,
        totalDependencies: Object.keys(dependencies).length + Object.keys(devDependencies).length,
        sizablePackages: dependencyAnalysis.filter(dep => dep.estimatedSize > 500 * 1024), // > 500KB
        analysis: dependencyAnalysis
      };

      console.log(`   ✅ Production dependencies: ${this.analysis.dependencies.production}`);
      console.log(`   ✅ Large packages: ${this.analysis.dependencies.sizablePackages.length}`);

    } catch (error) {
      console.error('   ❌ Dependency analysis failed:', error.message);
      this.analysis.dependencies.error = error.message;
    }
  }

  async analyzeDependencySizes(dependencies) {
    const analysis = [];

    // Common package size estimates (in bytes)
    const packageSizeEstimates = {
      'react': 40000,
      'react-dom': 130000,
      '@chakra-ui/react': 2500000,
      '@emotion/react': 60000,
      '@emotion/styled': 40000,
      'framer-motion': 400000,
      'axios': 15000,
      'react-router-dom': 25000,
      'swr': 30000,
      'date-fns': 200000
    };

    for (const [packageName, version] of Object.entries(dependencies)) {
      const estimatedSize = packageSizeEstimates[packageName] || 50000; // Default 50KB

      analysis.push({
        name: packageName,
        version: version,
        estimatedSize: estimatedSize,
        category: this.categorizePackage(packageName)
      });
    }

    return analysis.sort((a, b) => b.estimatedSize - a.estimatedSize);
  }

  categorizePackage(packageName) {
    const categories = {
      'UI Library': ['@chakra-ui', '@emotion', 'framer-motion'],
      'Core': ['react', 'react-dom'],
      'Routing': ['react-router'],
      'HTTP Client': ['axios', 'fetch'],
      'State Management': ['swr', 'zustand', 'redux'],
      'Utilities': ['date-fns', 'lodash'],
      'Icons': ['@chakra-ui/icons', 'react-icons'],
      'Build Tools': ['vite', '@vitejs']
    };

    for (const [category, packages] of Object.entries(categories)) {
      if (packages.some(pkg => packageName.includes(pkg))) {
        return category;
      }
    }

    return 'Other';
  }

  async analyzeLoadingPerformance() {
    console.log('⚡ Analyzing loading performance...');

    try {
      // Analyze index.html
      const indexHtmlPath = path.join(this.buildPath, 'index.html');
      const indexExists = await fs.access(indexHtmlPath).then(() => true).catch(() => false);

      if (indexExists) {
        const indexContent = await fs.readFile(indexHtmlPath, 'utf8');
        const loadingAnalysis = this.analyzeIndexHtml(indexContent);

        this.analysis.loadingPerformance = {
          ...loadingAnalysis,
          criticalResourceHints: this.analyzeCriticalResourceHints(indexContent),
          recommendations: this.generateLoadingRecommendations(loadingAnalysis)
        };

        console.log(`   ✅ Script tags: ${loadingAnalysis.scriptTags}`);
        console.log(`   ✅ Stylesheet tags: ${loadingAnalysis.stylesheetTags}`);
      } else {
        this.analysis.loadingPerformance.error = 'index.html not found in build output';
      }

    } catch (error) {
      console.error('   ❌ Loading performance analysis failed:', error.message);
      this.analysis.loadingPerformance.error = error.message;
    }
  }

  analyzeIndexHtml(content) {
    const scriptTags = (content.match(/<script[^>]*>/g) || []).length;
    const stylesheetTags = (content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/g) || []).length;
    const inlineStyles = (content.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).length;
    const inlineScripts = (content.match(/<script[^>]*>[\s\S]*?<\/script>/g) || []).length;

    // Check for performance optimizations
    const hasPreload = content.includes('rel="preload"');
    const hasPrefetch = content.includes('rel="prefetch"');
    const hasPreconnect = content.includes('rel="preconnect"');
    const hasAsyncScripts = content.includes('async');
    const hasDeferScripts = content.includes('defer');

    return {
      scriptTags,
      stylesheetTags,
      inlineStyles,
      inlineScripts,
      hasPreload,
      hasPrefetch,
      hasPreconnect,
      hasAsyncScripts,
      hasDeferScripts,
      totalSize: content.length
    };
  }

  analyzeCriticalResourceHints(content) {
    const hints = {
      preload: [],
      prefetch: [],
      preconnect: [],
      dnsPrefetch: []
    };

    const linkTags = content.match(/<link[^>]*>/g) || [];

    linkTags.forEach(tag => {
      if (tag.includes('rel="preload"')) {
        const href = tag.match(/href=["']([^"']*)["']/);
        if (href) hints.preload.push(href[1]);
      }
      if (tag.includes('rel="prefetch"')) {
        const href = tag.match(/href=["']([^"']*)["']/);
        if (href) hints.prefetch.push(href[1]);
      }
      if (tag.includes('rel="preconnect"')) {
        const href = tag.match(/href=["']([^"']*)["']/);
        if (href) hints.preconnect.push(href[1]);
      }
      if (tag.includes('rel="dns-prefetch"')) {
        const href = tag.match(/href=["']([^"']*)["']/);
        if (href) hints.dnsPrefetch.push(href[1]);
      }
    });

    return hints;
  }

  generateLoadingRecommendations(loadingAnalysis) {
    const recommendations = [];

    if (!loadingAnalysis.hasPreload) {
      recommendations.push({
        type: 'Resource Hints',
        priority: 'MEDIUM',
        suggestion: 'Add preload hints for critical resources (fonts, critical CSS)',
        implementation: '<link rel="preload" href="/critical.css" as="style">'
      });
    }

    if (!loadingAnalysis.hasPreconnect) {
      recommendations.push({
        type: 'Resource Hints',
        priority: 'LOW',
        suggestion: 'Add preconnect hints for external domains',
        implementation: '<link rel="preconnect" href="https://fonts.googleapis.com">'
      });
    }

    if (loadingAnalysis.inlineScripts > 2) {
      recommendations.push({
        type: 'Script Optimization',
        priority: 'MEDIUM',
        suggestion: 'Consider moving inline scripts to external files for better caching',
        implementation: 'Extract inline scripts to separate .js files'
      });
    }

    if (loadingAnalysis.scriptTags > 5) {
      recommendations.push({
        type: 'Bundle Optimization',
        priority: 'HIGH',
        suggestion: 'Consider code splitting to reduce the number of script tags',
        implementation: 'Implement dynamic imports and route-based code splitting'
      });
    }

    return recommendations;
  }

  generateOptimizationRecommendations() {
    const recommendations = [];

    // Bundle size recommendations
    if (this.analysis.bundleSize.totalSize > 2 * 1024 * 1024) { // > 2MB
      recommendations.push({
        category: 'Bundle Size',
        priority: 'HIGH',
        issue: `Large bundle size (${this.formatBytes(this.analysis.bundleSize.totalSize)})`,
        solution: 'Implement code splitting, tree shaking, and remove unused dependencies',
        impact: 'Improve initial page load time'
      });
    }

    // Large asset recommendations
    const largeAssets = this.analysis.bundleSize.assets?.filter(asset => asset.size > 500 * 1024) || [];
    if (largeAssets.length > 0) {
      recommendations.push({
        category: 'Asset Optimization',
        priority: 'MEDIUM',
        issue: `${largeAssets.length} large assets detected`,
        solution: 'Compress images, implement lazy loading, use WebP format',
        details: largeAssets.map(asset => `${asset.name}: ${this.formatBytes(asset.size)}`)
      });
    }

    // Dependency recommendations
    const largeDependencies = this.analysis.dependencies.sizablePackages || [];
    if (largeDependencies.length > 0) {
      recommendations.push({
        category: 'Dependencies',
        priority: 'MEDIUM',
        issue: `${largeDependencies.length} large dependencies`,
        solution: 'Consider lighter alternatives or implement tree shaking',
        details: largeDependencies.map(dep => `${dep.name}: ${this.formatBytes(dep.estimatedSize)}`)
      });
    }

    // Loading performance recommendations
    if (this.analysis.loadingPerformance.recommendations) {
      recommendations.push(...this.analysis.loadingPerformance.recommendations.map(rec => ({
        category: 'Loading Performance',
        priority: rec.priority,
        issue: rec.suggestion,
        solution: rec.implementation
      })));
    }

    return recommendations;
  }

  async generateReport() {
    this.analysis.recommendations = this.generateOptimizationRecommendations();

    const reportPath = path.join(this.projectRoot, 'performance-analysis', 'reports', `frontend-analysis-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(this.analysis, null, 2));

    console.log(`\n📋 Frontend analysis report saved to: ${reportPath}`);
    return this.analysis;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    console.log('🚀 Starting Frontend Bundle Analysis\n');

    try {
      await this.analyzeBundleSize();
      await this.analyzeDependencies();
      await this.analyzeLoadingPerformance();

      const report = await this.generateReport();

      console.log('\n📊 Frontend Analysis Summary:');
      console.log(`   Bundle Size: ${this.formatBytes(report.bundleSize.totalSize || 0)}`);
      console.log(`   Dependencies: ${report.dependencies.production || 0} production, ${report.dependencies.development || 0} dev`);
      console.log(`   Large Assets: ${report.bundleSize.assets?.filter(a => a.size > 500 * 1024).length || 0}`);
      console.log(`   Recommendations: ${report.recommendations.length}`);

      console.log('\n💡 Key Recommendations:');
      report.recommendations.slice(0, 5).forEach(rec => {
        console.log(`   [${rec.priority}] ${rec.category}: ${rec.issue || rec.solution}`);
      });

      return report;

    } catch (error) {
      console.error('❌ Frontend analysis failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const analyzer = new FrontendBundleAnalyzer();
  await analyzer.run();
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default FrontendBundleAnalyzer;
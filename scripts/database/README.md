# Database Integrity Audit System

This comprehensive database integrity audit system ensures the PostgreSQL database for Sesimiz Ol is production-ready with proper constraints, indexes, and data integrity.

## Overview

The audit system provides:
- **Comprehensive integrity validation** of foreign keys, constraints, and data consistency
- **Performance analysis** with index usage and optimization recommendations
- **Automated health monitoring** with actionable insights
- **Maintenance procedures** for ongoing database health
- **Cleanup scripts** for data hygiene and optimization

## Components

### 1. Core Audit Scripts

#### `integrity-audit.sql`
- Database health overview and statistics
- Foreign key constraint verification
- Orphaned records detection
- Data consistency checks across relations
- Index analysis and performance metrics
- Vacuum and analyze status
- Automated recommendations

#### `constraint-validation.sql`
- Primary key constraint validation
- Foreign key relationship verification
- Unique constraint validation (single and composite)
- Business logic constraint checks
- Date/time constraint validation
- Enum value validation

#### `performance-analysis.sql`
- Query performance analysis
- Index usage statistics and efficiency
- Buffer cache performance metrics
- Table scan analysis
- Storage and space utilization
- Performance recommendations

#### `cleanup-procedures.sql`
- Safe cleanup of expired data (tokens, sessions, notifications)
- Orphaned record removal
- Duplicate data cleanup
- Statistics and counter updates
- Security data cleanup

#### `maintenance-procedures.sql`
- Automated maintenance functions
- Daily/weekly maintenance procedures
- Index optimization analysis
- Performance monitoring procedures
- Maintenance alerting system

### 2. Health Check Application

#### `health-check.js`
Node.js application providing:
- Real-time database connectivity testing
- Application-level metrics and validation
- JSON and text output formats
- Comprehensive health scoring
- Automated recommendations

### 3. Automation and Orchestration

#### `run-audit.sh`
Comprehensive audit runner with:
- Full audit suite execution
- Individual component runs
- Automated report generation
- Error handling and validation
- Flexible output options

## Installation and Setup

### Prerequisites

1. **PostgreSQL Client Tools**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client

   # macOS
   brew install postgresql
   ```

2. **Node.js and Prisma**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Variables**
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

### Quick Start

1. **Run Complete Audit**
   ```bash
   ./scripts/database/run-audit.sh
   ```

2. **Health Check Only**
   ```bash
   ./scripts/database/run-audit.sh --health-only
   ```

3. **Performance Analysis Only**
   ```bash
   ./scripts/database/run-audit.sh --performance-only
   ```

## Usage Examples

### Complete Database Audit
```bash
# Run full audit suite
./scripts/database/run-audit.sh --verbose

# Custom output directory
./scripts/database/run-audit.sh --output-dir /path/to/reports
```

### Individual Components
```bash
# Integrity audit only
./scripts/database/run-audit.sh --integrity-only

# Performance analysis only
./scripts/database/run-audit.sh --performance-only

# Health check with verbose output
./scripts/database/run-audit.sh --health-only --verbose
```

### Maintenance Operations
```bash
# Install maintenance procedures
./scripts/database/run-audit.sh --maintenance

# Run cleanup procedures
./scripts/database/run-audit.sh --cleanup
```

### Direct SQL Execution
```bash
# Run individual SQL scripts
psql $DATABASE_URL -f scripts/database/integrity-audit.sql
psql $DATABASE_URL -f scripts/database/performance-analysis.sql
```

### Health Check Application
```bash
cd backend

# Text output
node scripts/database/health-check.js

# JSON output
node scripts/database/health-check.js --format=json

# Verbose mode
node scripts/database/health-check.js --verbose
```

## Production Deployment

### Scheduled Maintenance

#### Daily Tasks (via cron)
```bash
# 02:00 AM daily - health check and cleanup
0 2 * * * /path/to/sesimiz-ol/scripts/database/run-audit.sh --health-only >> /var/log/db-health.log 2>&1

# 03:00 AM daily - cleanup procedures
0 3 * * * /path/to/sesimiz-ol/scripts/database/run-audit.sh --cleanup >> /var/log/db-cleanup.log 2>&1
```

#### Weekly Tasks
```bash
# Sunday 01:00 AM - full integrity audit
0 1 * * 0 /path/to/sesimiz-ol/scripts/database/run-audit.sh --integrity-only >> /var/log/db-integrity.log 2>&1

# Sunday 04:00 AM - performance analysis
0 4 * * 0 /path/to/sesimiz-ol/scripts/database/run-audit.sh --performance-only >> /var/log/db-performance.log 2>&1
```

#### Monthly Tasks
```bash
# First Monday 00:00 AM - complete audit
0 0 1-7 * 1 /path/to/sesimiz-ol/scripts/database/run-audit.sh >> /var/log/db-audit-monthly.log 2>&1
```

### CI/CD Integration

#### GitHub Actions Example
```yaml
name: Database Audit
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run database audit
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          ./scripts/database/run-audit.sh --health-only
```

### Monitoring Integration

#### Health Check Endpoint
```javascript
// Add to your Express app
app.get('/api/health/database', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const result = execSync('node scripts/database/health-check.js --format=json', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    const healthData = JSON.parse(result);

    const statusCode = healthData.overall === 'HEALTHY' ? 200 :
                      healthData.overall === 'WARNING' ? 200 : 503;

    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(503).json({ error: 'Health check failed', message: error.message });
  }
});
```

## Report Analysis

### Understanding Audit Reports

#### Health Check Results
- **HEALTHY**: All systems operational
- **CAUTION**: Minor issues detected
- **WARNING**: Attention required
- **CRITICAL**: Immediate action needed

#### Performance Metrics
- **Cache Hit Ratio**: Target >95% for production
- **Dead Row Percentage**: Should be <20%
- **Index Usage**: Monitor unused indexes
- **Sequential Scan Ratio**: High values indicate missing indexes

#### Integrity Violations
- **Orphaned Records**: Data referencing non-existent parent records
- **Constraint Violations**: Unique, foreign key, or check constraint failures
- **Data Inconsistencies**: Counter mismatches or invalid state combinations

### Common Issues and Solutions

#### High Dead Row Percentage
```sql
-- Solution: Run vacuum on affected tables
VACUUM ANALYZE table_name;
```

#### Poor Cache Hit Ratio
```sql
-- Solution: Increase shared_buffers in postgresql.conf
shared_buffers = 256MB  # Increase based on available RAM
```

#### Unused Indexes
```sql
-- Solution: Drop unused indexes (after confirming they're not needed)
DROP INDEX IF EXISTS unused_index_name;
```

#### Missing Indexes on Foreign Keys
```sql
-- Solution: Add indexes on foreign key columns
CREATE INDEX idx_table_foreign_key_column ON table_name (foreign_key_column);
```

## Best Practices

### Regular Maintenance Schedule

1. **Daily**: Health checks, expired data cleanup
2. **Weekly**: Integrity audits, performance analysis
3. **Monthly**: Complete audit suite, capacity planning
4. **Quarterly**: Index optimization review, schema evolution planning

### Performance Optimization

1. **Monitor index usage** regularly and remove unused indexes
2. **Keep statistics current** with regular ANALYZE operations
3. **Monitor cache hit ratios** and tune buffer settings accordingly
4. **Plan for growth** with regular capacity assessments

### Data Integrity

1. **Validate constraints** regularly to catch application-level bugs
2. **Monitor for orphaned data** that may indicate deletion cascade issues
3. **Keep counters accurate** with regular update procedures
4. **Audit business logic** constraints to ensure data validity

## Troubleshooting

### Common Issues

#### Script Permissions
```bash
chmod +x scripts/database/run-audit.sh
```

#### Database Connection Issues
```bash
# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"
```

#### Missing Dependencies
```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client

# Install Node.js dependencies
cd backend && npm install
```

#### Output Directory Permissions
```bash
# Ensure output directory is writable
mkdir -p audit-reports
chmod 755 audit-reports
```

### Getting Help

1. **Check logs**: All operations generate detailed logs
2. **Review error messages**: Scripts provide specific error details
3. **Validate environment**: Ensure DATABASE_URL and dependencies are correct
4. **Test components individually**: Run individual scripts to isolate issues

## Security Considerations

- **Audit logs may contain sensitive information** - secure appropriately
- **Database credentials** should be protected and rotated regularly
- **Cleanup procedures** remove expired security tokens and sessions
- **Access control** should be implemented for audit script execution

## Extending the System

### Adding Custom Checks

1. **Create new SQL scripts** following the existing patterns
2. **Add to run-audit.sh** for automated execution
3. **Update health-check.js** for application-level validations
4. **Document new checks** in this README

### Integration with External Systems

- **Monitoring tools**: Export metrics to Prometheus, DataDog, etc.
- **Alerting systems**: Integrate with PagerDuty, Slack, etc.
- **CI/CD pipelines**: Add audit steps to deployment workflows
- **Dashboard systems**: Create visualizations for audit metrics
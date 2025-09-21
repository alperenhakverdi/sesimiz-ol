# Quick Start: Database Integrity Audit

## 🚀 Getting Started

### 1. Prerequisites Check
```bash
# Ensure you have PostgreSQL client tools
which psql

# Ensure Node.js is installed
which node

# Check if you're in the project directory
pwd  # Should show path ending with sesimiz-ol
```

### 2. Environment Setup
```bash
# Set your database connection (required)
export DATABASE_URL="postgresql://username:password@localhost:5432/sesimizol"

# Optional: Set password separately if not in URL
export PGPASSWORD="your_password"
```

### 3. Quick Health Check
```bash
# Run a quick health assessment
bash scripts/database/run-audit.sh --health-only --verbose
```

### 4. Complete Audit (Recommended)
```bash
# Run full database integrity audit
bash scripts/database/run-audit.sh --verbose
```

## 📊 Understanding Results

### Health Check Status
- **🟢 HEALTHY**: Database is operating optimally
- **🟡 CAUTION**: Minor issues detected, monitor closely
- **🟠 WARNING**: Attention required, schedule maintenance
- **🔴 CRITICAL**: Immediate action needed

### Common Recommendations

#### High Priority Actions
1. **Install Maintenance Procedures**
   ```bash
   bash scripts/database/run-audit.sh --maintenance
   ```

2. **Clean Up Expired Data**
   ```bash
   bash scripts/database/run-audit.sh --cleanup
   ```

#### Performance Optimizations
1. **Cache Hit Ratio < 95%**
   - Increase PostgreSQL `shared_buffers`
   - Consider more RAM for database server

2. **High Dead Row Percentage**
   ```sql
   VACUUM ANALYZE table_name;
   ```

3. **Unused Indexes**
   ```sql
   DROP INDEX unused_index_name;
   ```

## 🔧 Maintenance Setup

### Daily Health Monitoring
```bash
# Add to crontab for daily monitoring
0 2 * * * cd /path/to/sesimiz-ol && bash scripts/database/run-audit.sh --health-only >> logs/db-health.log 2>&1
```

### Weekly Comprehensive Audit
```bash
# Weekly complete audit
0 1 * * 0 cd /path/to/sesimiz-ol && bash scripts/database/run-audit.sh >> logs/db-audit.log 2>&1
```

## 📁 Report Locations

After running audits, find reports in:
- `audit-reports/` directory
- Files named with timestamp: `audit-type_YYYYMMDD_HHMMSS.log`

## 🚨 Emergency Procedures

### Database Issues Detected
1. **Check recent error logs**
2. **Run immediate health check**
3. **Execute cleanup procedures if safe**
4. **Contact database administrator**

### Performance Problems
1. **Check cache hit ratios**
2. **Identify slow queries**
3. **Review index usage**
4. **Consider maintenance window**

## 📞 Support

- **Documentation**: `scripts/database/README.md`
- **Detailed Findings**: `DATABASE_AUDIT_FINDINGS.md`
- **Script Help**: `bash scripts/database/run-audit.sh --help`

---

**Last Updated**: $(date)
**Audit System Version**: 1.0.0
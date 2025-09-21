const fs = require('fs');
const path = require('path');

/**
 * Database Production Configuration Setup
 * Optimizes PostgreSQL for production environment
 */

class DatabaseProductionConfig {
  constructor() {
    this.configs = {
      postgresql: this.getPostgreSQLConfig(),
      pgbouncer: this.getPgBouncerConfig(),
      backup: this.getBackupConfig(),
      monitoring: this.getMonitoringConfig(),
      optimization: this.getOptimizationConfig()
    };
  }

  // PostgreSQL Production Configuration
  getPostgreSQLConfig() {
    return {
      // Connection Settings
      max_connections: '200',
      shared_buffers: '256MB',
      effective_cache_size: '1GB',
      maintenance_work_mem: '64MB',
      checkpoint_completion_target: '0.9',
      wal_buffers: '16MB',
      default_statistics_target: '100',
      random_page_cost: '1.1',
      effective_io_concurrency: '200',
      work_mem: '4MB',
      min_wal_size: '1GB',
      max_wal_size: '4GB',

      // Security Settings
      ssl: 'on',
      ssl_cert_file: '/etc/ssl/certs/postgresql.crt',
      ssl_key_file: '/etc/ssl/private/postgresql.key',
      ssl_ca_file: '/etc/ssl/certs/ca-certificates.crt',
      password_encryption: 'scram-sha-256',

      // Logging Settings
      log_destination: 'csvlog',
      logging_collector: 'on',
      log_directory: '/var/log/postgresql',
      log_filename: 'postgresql-%Y-%m-%d_%H%M%S.log',
      log_file_mode: '0600',
      log_rotation_age: '1d',
      log_rotation_size: '10MB',
      log_min_duration_statement: '1000',
      log_checkpoints: 'on',
      log_connections: 'on',
      log_disconnections: 'on',
      log_lock_waits: 'on',
      log_temp_files: '0',
      log_autovacuum_min_duration: '0',

      // Performance Settings
      shared_preload_libraries: 'pg_stat_statements',
      track_activity_query_size: '2048',
      track_io_timing: 'on',
      track_functions: 'all',

      // Replication Settings (for read replicas)
      wal_level: 'replica',
      max_wal_senders: '5',
      max_replication_slots: '5',
      hot_standby: 'on',
      hot_standby_feedback: 'on'
    };
  }

  // PgBouncer Connection Pooling Configuration
  getPgBouncerConfig() {
    return {
      databases: {
        sesimiz_ol: {
          host: 'localhost',
          port: '5432',
          user: 'sesimiz_user',
          password: process.env.DB_PASSWORD,
          auth_type: 'scram-sha-256',
          pool_size: '25',
          reserve_pool: '5'
        }
      },
      pgbouncer: {
        listen_port: '6432',
        listen_addr: 'localhost',
        auth_type: 'scram-sha-256',
        auth_file: '/etc/pgbouncer/userlist.txt',
        admin_users: 'postgres',
        stats_users: 'postgres',
        pool_mode: 'transaction',
        server_reset_query: 'DISCARD ALL',
        max_client_conn: '200',
        default_pool_size: '25',
        min_pool_size: '5',
        reserve_pool_size: '5',
        reserve_pool_timeout: '5',
        max_db_connections: '50',
        max_user_connections: '50',
        server_round_robin: '1',
        log_connections: '1',
        log_disconnections: '1',
        log_pooler_errors: '1',
        application_name_add_host: '1'
      }
    };
  }

  // Backup Configuration
  getBackupConfig() {
    return {
      backup_strategy: {
        full_backup: {
          frequency: 'daily',
          time: '02:00',
          retention_days: '30',
          compression: 'gzip',
          command: 'pg_dump -Fc -Z9 sesimiz_ol > /backups/sesimiz_ol_$(date +%Y%m%d).dump'
        },
        incremental_backup: {
          frequency: 'hourly',
          wal_archiving: true,
          wal_archive_command: 'cp %p /backups/wal_archive/%f',
          retention_hours: '72'
        },
        point_in_time_recovery: {
          enabled: true,
          recovery_target_time: 'latest',
          recovery_command: 'restore_command = cp /backups/wal_archive/%f %p'
        }
      },
      backup_verification: {
        test_restore: {
          frequency: 'weekly',
          test_database: 'sesimiz_ol_test_restore'
        },
        integrity_check: {
          command: 'pg_dump --schema-only sesimiz_ol | psql -d sesimiz_ol_test',
          frequency: 'daily'
        }
      }
    };
  }

  // Monitoring Configuration
  getMonitoringConfig() {
    return {
      postgresql_exporter: {
        enabled: true,
        port: '9187',
        queries: {
          pg_stat_database: 'SELECT datname, numbackends, xact_commit, xact_rollback, blks_read, blks_hit FROM pg_stat_database',
          pg_stat_user_tables: 'SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch FROM pg_stat_user_tables',
          pg_stat_statements: 'SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10',
          pg_locks: 'SELECT mode, count(*) FROM pg_locks GROUP BY mode',
          pg_stat_activity: 'SELECT state, count(*) FROM pg_stat_activity GROUP BY state'
        }
      },
      alerts: {
        connection_count: {
          threshold: '150',
          severity: 'warning'
        },
        database_size: {
          threshold: '80%',
          severity: 'warning'
        },
        slow_queries: {
          threshold: '5000ms',
          severity: 'critical'
        },
        replication_lag: {
          threshold: '10MB',
          severity: 'warning'
        },
        cache_hit_ratio: {
          threshold: '95%',
          severity: 'warning'
        }
      }
    };
  }

  // Performance Optimization Settings
  getOptimizationConfig() {
    return {
      indexes: {
        stories: [
          'CREATE INDEX CONCURRENTLY idx_stories_created_at_desc ON stories (created_at DESC)',
          'CREATE INDEX CONCURRENTLY idx_stories_author_id ON stories (author_id)',
          'CREATE INDEX CONCURRENTLY idx_stories_status ON stories (status)',
          'CREATE INDEX CONCURRENTLY idx_stories_view_count_desc ON stories (view_count DESC)',
          'CREATE INDEX CONCURRENTLY idx_stories_search_vector ON stories USING gin(search_vector)',
          'CREATE INDEX CONCURRENTLY idx_stories_tags ON stories USING gin(tags)'
        ],
        users: [
          'CREATE UNIQUE INDEX CONCURRENTLY idx_users_email_unique ON users (email)',
          'CREATE UNIQUE INDEX CONCURRENTLY idx_users_nickname_unique ON users (nickname)',
          'CREATE INDEX CONCURRENTLY idx_users_created_at ON users (created_at)'
        ],
        comments: [
          'CREATE INDEX CONCURRENTLY idx_comments_story_id ON comments (story_id)',
          'CREATE INDEX CONCURRENTLY idx_comments_author_id ON comments (author_id)',
          'CREATE INDEX CONCURRENTLY idx_comments_parent_id ON comments (parent_id)',
          'CREATE INDEX CONCURRENTLY idx_comments_created_at ON comments (created_at DESC)'
        ],
        organizations: [
          'CREATE INDEX CONCURRENTLY idx_organizations_status ON organizations (status)',
          'CREATE INDEX CONCURRENTLY idx_organizations_created_at ON organizations (created_at)'
        ]
      },
      vacuum_settings: {
        autovacuum: 'on',
        autovacuum_max_workers: '3',
        autovacuum_naptime: '1min',
        autovacuum_vacuum_threshold: '50',
        autovacuum_vacuum_scale_factor: '0.2',
        autovacuum_analyze_threshold: '50',
        autovacuum_analyze_scale_factor: '0.1',
        autovacuum_vacuum_cost_delay: '10ms',
        autovacuum_vacuum_cost_limit: '200'
      },
      maintenance_commands: [
        'REINDEX DATABASE sesimiz_ol',
        'ANALYZE',
        'VACUUM ANALYZE',
        'UPDATE pg_stat_statements SET calls = 0, total_time = 0'
      ]
    };
  }

  // Generate PostgreSQL configuration file
  generatePostgreSQLConf() {
    const config = this.configs.postgresql;
    let confContent = '# PostgreSQL Production Configuration\n';
    confContent += '# Generated automatically - do not edit manually\n\n';

    Object.entries(config).forEach(([key, value]) => {
      confContent += `${key} = '${value}'\n`;
    });

    return confContent;
  }

  // Generate PgBouncer configuration file
  generatePgBouncerConf() {
    const config = this.configs.pgbouncer;
    let confContent = '; PgBouncer Production Configuration\n\n';

    confContent += '[databases]\n';
    Object.entries(config.databases).forEach(([dbName, dbConfig]) => {
      const configLine = Object.entries(dbConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      confContent += `${dbName} = ${configLine}\n`;
    });

    confContent += '\n[pgbouncer]\n';
    Object.entries(config.pgbouncer).forEach(([key, value]) => {
      confContent += `${key} = ${value}\n`;
    });

    return confContent;
  }

  // Generate backup script
  generateBackupScript() {
    const config = this.configs.backup;

    return `#!/bin/bash
# PostgreSQL Backup Script for Production

set -e

# Configuration
DB_NAME="sesimiz_ol"
BACKUP_DIR="/backups"
WAL_ARCHIVE_DIR="/backups/wal_archive"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="30"

# Create backup directories
mkdir -p $BACKUP_DIR
mkdir -p $WAL_ARCHIVE_DIR

# Full backup
echo "Starting full backup..."
pg_dump -Fc -Z9 $DB_NAME > $BACKUP_DIR/sesimiz_ol_$DATE.dump

# Verify backup
echo "Verifying backup..."
pg_restore --list $BACKUP_DIR/sesimiz_ol_$DATE.dump > /dev/null

# Clean old backups
echo "Cleaning old backups..."
find $BACKUP_DIR -name "sesimiz_ol_*.dump" -mtime +$RETENTION_DAYS -delete

# WAL archive cleanup
find $WAL_ARCHIVE_DIR -mtime +3 -delete

echo "Backup completed successfully: sesimiz_ol_$DATE.dump"

# Test restore (weekly)
if [ $(date +%w) -eq 0 ]; then
    echo "Running weekly backup verification..."
    createdb sesimiz_ol_test_restore 2>/dev/null || true
    pg_restore -d sesimiz_ol_test_restore $BACKUP_DIR/sesimiz_ol_$DATE.dump
    dropdb sesimiz_ol_test_restore
    echo "Backup verification completed successfully"
fi
`;
  }

  // Generate monitoring setup script
  generateMonitoringScript() {
    return `#!/bin/bash
# PostgreSQL Monitoring Setup

# Install postgresql_exporter
echo "Setting up PostgreSQL monitoring..."

# Create monitoring user
sudo -u postgres psql -c "CREATE USER monitoring WITH PASSWORD 'monitoring_password';"
sudo -u postgres psql -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;"
sudo -u postgres psql -c "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO monitoring;"

# Install postgres_exporter
wget https://github.com/prometheus-community/postgres_exporter/releases/download/v0.11.1/postgres_exporter-0.11.1.linux-amd64.tar.gz
tar -xzf postgres_exporter-0.11.1.linux-amd64.tar.gz
sudo mv postgres_exporter-0.11.1.linux-amd64/postgres_exporter /usr/local/bin/

# Create systemd service
cat > /etc/systemd/system/postgres_exporter.service << EOF
[Unit]
Description=PostgreSQL Exporter
After=network.target

[Service]
Type=simple
User=postgres
Environment=DATA_SOURCE_NAME="postgresql://monitoring:monitoring_password@localhost:5432/sesimiz_ol?sslmode=disable"
ExecStart=/usr/local/bin/postgres_exporter
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable postgres_exporter
sudo systemctl start postgres_exporter

echo "PostgreSQL monitoring setup completed"
echo "Metrics available at http://localhost:9187/metrics"
`;
  }

  // Generate optimization script
  generateOptimizationScript() {
    const config = this.configs.optimization;

    let script = `#!/bin/bash
# PostgreSQL Performance Optimization Script

set -e

echo "Starting PostgreSQL optimization..."

# Create indexes
echo "Creating performance indexes..."
`;

    Object.entries(config.indexes).forEach(([table, indexes]) => {
      script += `\n# ${table} indexes\n`;
      indexes.forEach(indexSql => {
        script += `sudo -u postgres psql -d sesimiz_ol -c "${indexSql}"\n`;
      });
    });

    script += `
# Update statistics
echo "Updating table statistics..."
sudo -u postgres psql -d sesimiz_ol -c "ANALYZE;"

# Optimize queries
echo "Optimizing query performance..."
sudo -u postgres psql -d sesimiz_ol -c "REINDEX DATABASE sesimiz_ol;"

# Enable pg_stat_statements
echo "Enabling query statistics..."
sudo -u postgres psql -d sesimiz_ol -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

echo "PostgreSQL optimization completed successfully"
`;

    return script;
  }

  // Generate all configuration files
  async generateAllConfigs(outputDir = './production-configs') {
    try {
      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      console.log('🚀 Generating PostgreSQL production configurations...');

      // Generate PostgreSQL config
      const postgresqlConf = this.generatePostgreSQLConf();
      fs.writeFileSync(path.join(outputDir, 'postgresql.conf'), postgresqlConf);
      console.log('✅ postgresql.conf generated');

      // Generate PgBouncer config
      const pgbouncerConf = this.generatePgBouncerConf();
      fs.writeFileSync(path.join(outputDir, 'pgbouncer.ini'), pgbouncerConf);
      console.log('✅ pgbouncer.ini generated');

      // Generate backup script
      const backupScript = this.generateBackupScript();
      fs.writeFileSync(path.join(outputDir, 'backup.sh'), backupScript, { mode: 0o755 });
      console.log('✅ backup.sh generated');

      // Generate monitoring script
      const monitoringScript = this.generateMonitoringScript();
      fs.writeFileSync(path.join(outputDir, 'setup-monitoring.sh'), monitoringScript, { mode: 0o755 });
      console.log('✅ setup-monitoring.sh generated');

      // Generate optimization script
      const optimizationScript = this.generateOptimizationScript();
      fs.writeFileSync(path.join(outputDir, 'optimize-db.sh'), optimizationScript, { mode: 0o755 });
      console.log('✅ optimize-db.sh generated');

      // Generate deployment guide
      const deploymentGuide = this.generateDeploymentGuide();
      fs.writeFileSync(path.join(outputDir, 'DEPLOYMENT_GUIDE.md'), deploymentGuide);
      console.log('✅ DEPLOYMENT_GUIDE.md generated');

      console.log(`\n🎯 All production configurations generated in: ${outputDir}`);
      console.log('\nNext steps:');
      console.log('1. Review and customize configurations for your environment');
      console.log('2. Copy postgresql.conf to PostgreSQL data directory');
      console.log('3. Install and configure PgBouncer with pgbouncer.ini');
      console.log('4. Set up automated backups with backup.sh');
      console.log('5. Run database optimizations with optimize-db.sh');
      console.log('6. Set up monitoring with setup-monitoring.sh');

      return {
        status: 'SUCCESS',
        outputDir: outputDir,
        files: [
          'postgresql.conf',
          'pgbouncer.ini',
          'backup.sh',
          'setup-monitoring.sh',
          'optimize-db.sh',
          'DEPLOYMENT_GUIDE.md'
        ]
      };

    } catch (error) {
      console.error('❌ Error generating configurations:', error.message);
      return {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  // Generate deployment guide
  generateDeploymentGuide() {
    return `# PostgreSQL Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying PostgreSQL in production for the Sesimiz Ol application.

## Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- PostgreSQL 14+
- Minimum 4GB RAM, 50GB storage
- SSL certificates for secure connections

## Installation Steps

### 1. PostgreSQL Installation
\`\`\`bash
# Ubuntu
sudo apt update
sudo apt install postgresql-14 postgresql-client-14 postgresql-contrib-14

# CentOS
sudo dnf install postgresql14-server postgresql14-contrib
sudo postgresql-14-setup initdb
\`\`\`

### 2. Configuration
\`\`\`bash
# Copy production configuration
sudo cp postgresql.conf /var/lib/pgsql/14/data/
sudo chown postgres:postgres /var/lib/pgsql/14/data/postgresql.conf

# Restart PostgreSQL
sudo systemctl restart postgresql-14
sudo systemctl enable postgresql-14
\`\`\`

### 3. PgBouncer Setup
\`\`\`bash
# Install PgBouncer
sudo apt install pgbouncer  # Ubuntu
sudo dnf install pgbouncer  # CentOS

# Copy configuration
sudo cp pgbouncer.ini /etc/pgbouncer/
sudo chown pgbouncer:pgbouncer /etc/pgbouncer/pgbouncer.ini

# Start PgBouncer
sudo systemctl restart pgbouncer
sudo systemctl enable pgbouncer
\`\`\`

### 4. Database Optimization
\`\`\`bash
# Run optimization script
chmod +x optimize-db.sh
./optimize-db.sh
\`\`\`

### 5. Backup Configuration
\`\`\`bash
# Set up automated backups
sudo mkdir -p /backups
sudo chown postgres:postgres /backups
sudo cp backup.sh /opt/
sudo chmod +x /opt/backup.sh

# Add to cron
echo "0 2 * * * /opt/backup.sh" | sudo crontab -u postgres -
\`\`\`

### 6. Monitoring Setup
\`\`\`bash
# Install monitoring
chmod +x setup-monitoring.sh
./setup-monitoring.sh
\`\`\`

## Performance Tuning

### Memory Settings
- \`shared_buffers\`: 25% of total RAM
- \`effective_cache_size\`: 75% of total RAM
- \`work_mem\`: 4MB (adjust based on concurrent connections)

### Connection Settings
- \`max_connections\`: 200 (adjust based on application needs)
- Use PgBouncer for connection pooling
- Monitor connection usage regularly

### Storage Optimization
- Use SSDs for database storage
- Separate WAL files on different disk
- Regular VACUUM and ANALYZE operations

## Security Configuration

### SSL/TLS Setup
\`\`\`bash
# Generate SSL certificates
sudo openssl req -new -text -out server.req
sudo openssl rsa -in privkey.pem -out server.key
sudo openssl req -x509 -in server.req -text -key server.key -out server.crt

# Set permissions
sudo chmod 600 server.key
sudo chown postgres:postgres server.key server.crt
\`\`\`

### Access Control
- Configure \`pg_hba.conf\` for secure access
- Use strong passwords
- Enable audit logging
- Regular security updates

## Monitoring and Alerting

### Key Metrics to Monitor
- Connection count
- Database size
- Query performance
- Replication lag
- Cache hit ratio
- Disk usage

### Alert Thresholds
- Connections > 150: Warning
- Database size > 80%: Warning
- Query time > 5s: Critical
- Cache hit ratio < 95%: Warning

## Backup and Recovery

### Backup Strategy
- Daily full backups at 2 AM
- Continuous WAL archiving
- 30-day retention policy
- Weekly backup verification

### Recovery Procedures
\`\`\`bash
# Point-in-time recovery
sudo -u postgres pg_ctl stop -D /var/lib/pgsql/14/data
sudo -u postgres pg_restore -d sesimiz_ol backup_file.dump
\`\`\`

## Troubleshooting

### Common Issues
1. **High connection count**: Check application connection pooling
2. **Slow queries**: Review indexes and query plans
3. **High disk usage**: Run VACUUM FULL
4. **Replication lag**: Check network and disk I/O

### Log Analysis
\`\`\`bash
# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Query performance analysis
sudo -u postgres psql -d sesimiz_ol -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
\`\`\`

## Maintenance Tasks

### Daily
- Monitor system resources
- Check backup completion
- Review error logs

### Weekly
- Verify backup integrity
- Analyze slow queries
- Update table statistics

### Monthly
- Update PostgreSQL and extensions
- Review and optimize indexes
- Capacity planning review

## Contact and Support
For issues with this deployment, contact the development team or refer to PostgreSQL documentation.
`;
  }
}

// Export for use in other scripts
module.exports = DatabaseProductionConfig;

// Generate configs if called directly
if (require.main === module) {
  const config = new DatabaseProductionConfig();
  config.generateAllConfigs('./scripts/production/database-configs')
    .then(result => {
      if (result.status === 'SUCCESS') {
        console.log('\n🎯 Database production configuration completed successfully!');
        process.exit(0);
      } else {
        console.error('\n❌ Configuration generation failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Configuration error:', error);
      process.exit(1);
    });
}
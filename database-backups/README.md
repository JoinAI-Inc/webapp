# 数据库备份与恢复说明

## 备份信息

- **备份时间**: 2026-02-13 22:36:07
- **备份文件**: `database-backups/webapp_backup_20260213_223607.sql.gz`
- **文件大小**: 7.4KB (压缩后)
- **原始大小**: 40KB
- **数据库**: PostgreSQL (webapp)
- **容器**: webapp-postgres

## 快速备份命令

```bash
# 创建新备份
mkdir -p database-backups
docker exec webapp-postgres pg_dump -U postgres -d webapp --clean --if-exists > database-backups/webapp_backup_$(date +"%Y%m%d_%H%M%S").sql
gzip database-backups/webapp_backup_*.sql
```

## 恢复数据库

### 方法1：从压缩备份恢复

```bash
# 恢复到webapp数据库（会清空现有数据）
gunzip -c database-backups/webapp_backup_20260213_223607.sql.gz | \
  docker exec -i webapp-postgres psql -U postgres -d webapp
```

### 方法2：从未压缩备份恢复

```bash
# 先解压
gunzip database-backups/webapp_backup_20260213_223607.sql.gz

# 恢复
docker exec -i webapp-postgres psql -U postgres -d webapp < \
  database-backups/webapp_backup_20260213_223607.sql
```

## 注意事项

1. **备份前提醒**
   - 恢复操作会删除现有数据（由于使用了--clean参数）
   - 确保在低峰期执行恢复操作
   - 恢复前建议先备份当前数据

2. **验证备份完整性**
   ```bash
   gunzip -t database-backups/webapp_backup_20260213_223607.sql.gz
   ```

3. **查看备份内容**
   ```bash
   gunzip -c database-backups/webapp_backup_20260213_223607.sql.gz | less
   ```

## 自动备份计划（可选）

可以设置cron定时任务自动备份：

```bash
# 每天凌晨2点备份
0 2 * * * cd /path/to/webapp && ./backup-database.sh
```

## 当前备份列表

```bash
ls -lht database-backups/*.sql.gz
```

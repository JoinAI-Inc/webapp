#!/bin/bash

# 优化后的数据库备份脚本（Docker版本）

BACKUP_DIR="./database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="webapp_backup_$TIMESTAMP.sql"
CONTAINER_NAME="webapp-postgres"
DB_NAME="webapp"
DB_USER="postgres"

echo "========================================="
echo "数据库备份工具"
echo "========================================="
echo "备份时间: $(date)"
echo "容器名称: $CONTAINER_NAME"
echo "数据库: $DB_NAME"
echo ""

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查容器是否运行
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ 错误: 容器 $CONTAINER_NAME 未运行"
  echo "可用的容器："
  docker ps --format "table {{.Names}}\t{{.Status}}"
  exit 1
fi

echo "✓ 容器检查通过"

# 执行备份
echo "正在备份数据库..."
docker exec $CONTAINER_NAME pg_dump \
  -U $DB_USER \
  -d $DB_NAME \
  --clean \
  --if-exists \
  > "$BACKUP_DIR/$BACKUP_FILE" 2>&1

# 检查备份是否成功
if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/$BACKUP_FILE" ]; then
  FILE_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
  echo "✅ 备份成功: $FILE_SIZE"
  
  # 压缩备份文件
  gzip "$BACKUP_DIR/$BACKUP_FILE"
  COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_FILE}.gz" | cut -f1)
  echo "✅ 已压缩: $COMPRESSED_SIZE"
  
  # 验证备份完整性
  if gunzip -t "$BACKUP_DIR/${BACKUP_FILE}.gz" 2>/dev/null; then
    echo "✅ 完整性验证通过"
  else
    echo "⚠️  警告: 完整性验证失败"
  fi
  
  echo ""
  echo "备份文件: $BACKUP_DIR/${BACKUP_FILE}.gz"
  
  # 保留最近5次备份
  OLD_BACKUPS=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +6)
  if [ ! -z "$OLD_BACKUPS" ]; then
    echo ""
    echo "清理旧备份..."
    echo "$OLD_BACKUPS" | xargs rm -f
    echo "✅ 已删除 $(echo "$OLD_BACKUPS" | wc -l | tr -d ' ') 个旧备份"
  fi
  
  echo ""
  echo "========================================="
  echo "当前所有备份:"
  echo "========================================="
  ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print $9, "-", $5, "-", $6, $7, $8}'
  
  echo ""
  echo "✅ 备份完成！"
  echo ""
  echo "恢复命令:"
  echo "gunzip -c $BACKUP_DIR/${BACKUP_FILE}.gz | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME"
  
else
  echo "❌ 备份失败！"
  if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "错误信息:"
    cat "$BACKUP_DIR/$BACKUP_FILE"
  fi
  exit 1
fi

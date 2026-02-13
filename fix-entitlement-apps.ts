// 修复现有UserEntitlement记录的apps关联
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function fixEntitlementApps() {
    console.log('开始修复UserEntitlement的apps关联...');

    // 1. 获取所有ACTIVE的entitlements，且没有apps关联的
    const entitlements = await prisma.userEntitlement.findMany({
        where: {
            status: 'ACTIVE'
        },
        include: {
            apps: true,
            order: {
                include: {
                    pricingPlan: {
                        include: {
                            apps: true
                        }
                    }
                }
            }
        }
    });

    console.log(`找到 ${entitlements.length} 个活跃的entitlements`);

    let fixed = 0;
    let skipped = 0;

    for (const entitlement of entitlements) {
        // 如果已经有apps关联，跳过
        if (entitlement.apps && entitlement.apps.length > 0) {
            console.log(`Entitlement ${entitlement.id} 已有 ${entitlement.apps.length} 个apps，跳过`);
            skipped++;
            continue;
        }

        // 获取对应plan的apps
        const planApps = entitlement.order?.pricingPlan?.apps || [];

        if (planApps.length === 0) {
            console.log(`Entitlement ${entitlement.id} 的plan没有关联apps，跳过`);
            skipped++;
            continue;
        }

        // 创建UserEntitlementApp关联
        try {
            await prisma.userEntitlementApp.createMany({
                data: planApps.map(pa => ({
                    entitlementId: entitlement.id,
                    appId: pa.appId
                })),
                skipDuplicates: true
            });

            console.log(`✅ Entitlement ${entitlement.id} 已关联 ${planApps.length} 个apps`);
            fixed++;
        } catch (error: any) {
            console.error(`❌ Entitlement ${entitlement.id} 修复失败:`, error.message);
        }
    }

    console.log('\n修复完成！');
    console.log(`- 修复: ${fixed}`);
    console.log(`- 跳过: ${skipped}`);
    console.log(`- 总计: ${entitlements.length}`);
}

fixEntitlementApps()
    .then(() => {
        console.log('脚本执行完成');
        process.exit(0);
    })
    .catch((error) => {
        console.error('脚本执行失败:', error);
        process.exit(1);
    });

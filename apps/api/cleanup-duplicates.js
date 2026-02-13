const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log('🧹 Cleaning up duplicate plans...\n');

    // Find all Pro Subscription plans
    const proPlans = await prisma.pricingPlan.findMany({
        where: { name: 'Pro Subscription', scope: 'GLOBAL' },
        orderBy: { id: 'asc' }
    });

    console.log(`Found ${proPlans.length} Pro Subscription plans`);

    if (proPlans.length > 1) {
        // Keep the first one, delete the rest
        const toKeep = proPlans[0];
        const toDelete = proPlans.slice(1);

        console.log(`Keeping plan ID ${toKeep.id}`);
        console.log(`Deleting ${toDelete.length} duplicate(s): ${toDelete.map(p => p.id).join(', ')}`);

        for (const plan of toDelete) {
            await prisma.pricingPlan.delete({ where: { id: plan.id } });
        }

        console.log('\n✅ Cleanup complete!');
    } else {
        console.log('No duplicates found.');
    }
}

cleanup()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });

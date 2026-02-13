const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    console.log('=== Checking Database Data ===\n');

    // Check apps
    const apps = await prisma.application.findMany();
    console.log('Apps:', apps.length);
    apps.forEach(app => console.log(`  - ${app.name} (${app.appKey})`));

    // Check plans
    const plans = await prisma.pricingPlan.findMany({
        include: { applications: true }
    });
    console.log('\nPlans:', plans.length);
    plans.forEach(plan => {
        console.log(`  - ${plan.name} | Type: ${plan.type} | Scope: ${plan.scope} | Price: $${plan.price}`);
        if (plan.applications.length > 0) {
            console.log(`    Linked to apps: ${plan.applications.map(a => a.appId).join(', ')}`);
        }
    });
}

checkData()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

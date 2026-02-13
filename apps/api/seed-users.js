const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creating test users...\n');

    // Create test users
    const user1 = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            email: 'alice@example.com',
            name: 'Alice Smith',
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            email: 'bob@example.com',
            name: 'Bob Johnson',
        },
    });

    const user3 = await prisma.user.upsert({
        where: { email: 'charlie@example.com' },
        update: {},
        create: {
            email: 'charlie@example.com',
            name: 'Charlie Brown',
            isLocked: true, // Locked user for testing
        },
    });

    console.log('✅ Created test users:', user1.email, user2.email, user3.email);

    // Create some orders for testing
    const apps = await prisma.application.findMany();
    const plans = await prisma.pricingPlan.findMany();

    if (apps.length > 0 && plans.length > 0) {
        // Alice buys Editor License
        const editorPlan = plans.find(p => p.scope === 'SPECIFIC_APP');
        if (editorPlan) {
            const order1 = await prisma.order.create({
                data: {
                    id: `ord_test_${Date.now()}_1`,
                    userId: user1.id,
                    planId: editorPlan.id,
                    amount: editorPlan.price,
                    status: 'PAID',
                    paidAt: new Date(),
                }
            });

            // Create entitlement
            await prisma.entitlement.create({
                data: {
                    userId: user1.id,
                    sourceOrderId: order1.id,
                    appId: apps.find(a => a.appKey === 'app_editor_001')?.id,
                    type: 'PERMANENT',
                }
            });
            console.log('✅ Created order for Alice (Editor License)');
        }

        // Bob subscribes to Pro
        const proPlan = plans.find(p => p.scope === 'GLOBAL');
        if (proPlan) {
            const order2 = await prisma.order.create({
                data: {
                    id: `ord_test_${Date.now()}_2`,
                    userId: user2.id,
                    planId: proPlan.id,
                    amount: proPlan.price,
                    status: 'PAID',
                    paidAt: new Date(),
                }
            });

            // Create entitlement (Global)
            await prisma.entitlement.create({
                data: {
                    userId: user2.id,
                    sourceOrderId: order2.id,
                    appId: null, // Global access
                    type: 'SUBSCRIPTION',
                    expireTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                }
            });
            console.log('✅ Created order for Bob (Pro Subscription)');
        }
    }

    console.log('\n🎉 Test users and orders created!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });

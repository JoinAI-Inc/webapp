// 快速查询 PricingPlan 货币配置
const { PrismaClient } = require('@repo/database');

const prisma = new PrismaClient();

async function checkPricingPlans() {
    try {
        const plans = await prisma.pricingPlan.findMany({
            select: {
                id: true,
                name: true,
                price: true,
                currency: true,
                stripePriceId: true,
                planType: true,
            },
            take: 10
        });

        console.log('=== Pricing Plans ===');
        plans.forEach(plan => {
            console.log(`ID: ${plan.id}`);
            console.log(`Name: ${plan.name}`);
            console.log(`Price: ${plan.price} ${plan.currency}`);
            console.log(`Type: ${plan.planType}`);
            console.log(`Stripe Price ID: ${plan.stripePriceId || 'NOT SET'}`);
            console.log('---');
        });

        if (plans.some(p => p.currency !== 'USD')) {
            console.log('\n⚠️  WARNING: Non-USD currency detected!');
            console.log('PayPal in Stripe test mode works best with USD.');
            console.log('Consider creating USD test prices.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkPricingPlans();

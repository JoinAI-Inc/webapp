/**
 * 队列系统测试脚本
 * 
 * 使用方法：
 * 1. 确保服务正在运行 (yarn dev)
 * 2. 确保 .env.local 已配置 Upstash Redis 和 NANO_BANANA_API_KEY
 * 3. 运行: node apps/bacc/scripts/test-queue.js
 */

const BASE_URL = 'http://localhost:3003';

// 测试用的 base64 图片（1x1 透明 PNG）
const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function submitTask(type, payload) {
    console.log(`\n📤 Submitting ${type} task...`);
    const response = await fetch(`${BASE_URL}/api/queue/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 注意：实际使用需要带上 session cookie
        },
        body: JSON.stringify({ type, payload }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Submit failed');
    }

    console.log(`✅ Task submitted: ${data.taskId}`);
    return data.taskId;
}

async function checkStatus(taskId) {
    const response = await fetch(`${BASE_URL}/api/queue/status?taskId=${taskId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Status check failed');
    }

    return data;
}

async function processQueue() {
    console.log(`\n⚙️  Triggering worker...`);
    const response = await fetch(`${BASE_URL}/api/queue/process`, {
        method: 'POST',
    });

    const data = await response.json();
    console.log(`✅ Worker processed ${data.processed} tasks`);
    console.log(`📊 Queue stats:`, data.queueStats);
    return data;
}

async function pollUntilComplete(taskId, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        console.log(`\n🔍 Checking status (attempt ${i + 1}/${maxAttempts})...`);
        const status = await checkStatus(taskId);
        console.log(`   Status: ${status.status}`);

        if (status.status === 'completed') {
            console.log(`✅ Task completed!`);
            console.log(`   Result:`, status.result);
            return status;
        }

        if (status.status === 'failed') {
            console.error(`❌ Task failed: ${status.error}`);
            return status;
        }

        // 等待 2 秒
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Polling timeout');
}

async function main() {
    try {
        console.log('🚀 Queue System Test\n');
        console.log('='.repeat(50));

        // 1. 提交测试任务
        const taskId = await submitTask('hanfu', {
            image: TEST_IMAGE,
            style: 'tang',
        });

        // 2. 检查初始状态
        console.log('\n📋 Initial status check...');
        const initialStatus = await checkStatus(taskId);
        console.log(`   Status: ${initialStatus.status}`);

        // 3. 触发 worker 处理
        await processQueue();

        // 4. 轮询直到完成
        await pollUntilComplete(taskId);

        console.log('\n' + '='.repeat(50));
        console.log('✅ Test completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();

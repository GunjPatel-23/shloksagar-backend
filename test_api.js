const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/public/videos',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('\n🔍 Testing backend API: http://localhost:3000/api/v1/public/videos\n');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('📊 Status Code:', res.statusCode);
        console.log('📦 Response:\n');

        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));

            if (json.data && Array.isArray(json.data)) {
                console.log(`\n✅ API returned ${json.data.length} video(s)`);
                if (json.data.length > 0) {
                    console.log('\n📹 Video details:');
                    json.data.forEach((v, i) => {
                        console.log(`${i + 1}. ${v.title_en || v.title_hi || v.title_gu || 'No title'}`);
                    });
                }
            }
        } catch (e) {
            console.log(data);
        }

        console.log('\n');
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Backend server might not be running on port 3000');
    console.log('Start it with: npm run dev\n');
    process.exit(1);
});

req.end();

// Keep-Alive Script for TuneDrop Backend
// Run this script to keep your Render server awake

const https = require('https');

const BACKEND_URL = 'https://tunedrop.onrender.com';
const HEALTH_ENDPOINT = '/api/health';
const PING_INTERVAL = 1 * 60 * 1000; // 1 minute

function pingServer() {
  const options = {
    hostname: 'tunedrop.onrender.com',
    port: 443,
    path: HEALTH_ENDPOINT,
    method: 'GET',
    headers: {
      'User-Agent': 'TuneDrop-KeepAlive/1.0'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const timestamp = new Date().toISOString();
      if (res.statusCode === 200) {
        console.log(`✅ [${timestamp}] Server is awake - Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log(`📊 Response: ${response.message}`);
        } catch (e) {
          console.log(`📊 Response: ${data.substring(0, 100)}...`);
        }
      } else {
        console.log(`⚠️ [${timestamp}] Server responded with status: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] Error pinging server:`, error.message);
  });

  req.setTimeout(10000, () => {
    const timestamp = new Date().toISOString();
    console.error(`⏰ [${timestamp}] Request timeout`);
    req.destroy();
  });

  req.end();
}

// Initial ping
console.log('🚀 Starting TuneDrop Keep-Alive Script...');
console.log(`🎯 Target: ${BACKEND_URL}${HEALTH_ENDPOINT}`);
console.log(`⏰ Interval: ${PING_INTERVAL / 1000 / 60} minutes`);
console.log('');

pingServer();

// Set up periodic pings
setInterval(pingServer, PING_INTERVAL);

console.log('✅ Keep-alive script is running. Press Ctrl+C to stop.');
console.log('');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Keep-alive script stopped.');
  process.exit(0);
});

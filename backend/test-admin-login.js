const http = require('http');

const postData = JSON.stringify({
  email: 'admin@nissaet.com',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    
    const response = JSON.parse(data);
    if (response.token && response.user) {
      console.log('\n✅ Admin Login successful!');
      console.log('Email:', response.user.email);
      console.log('Name:', response.user.full_name);
      console.log('Role:', response.user.role);
      console.log('Token:', response.token.substring(0, 30) + '...');
    } else if (response.message) {
      console.log('\n❌ Login Error:', response.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();

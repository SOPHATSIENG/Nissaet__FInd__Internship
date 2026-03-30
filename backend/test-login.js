const http = require('http');

const postData = JSON.stringify({
  email: 'test@example.com',
  password: 'test123'
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
    console.log('Response:', data);
    
    const response = JSON.parse(data);
    if (response.token && response.user) {
      console.log('\n✅ Login successful!');
      console.log('Token:', response.token.substring(0, 20) + '...');
      console.log('User:', response.user.email, `(${response.user.role})`);
    } else if (response.message) {
      console.log('\n❌', response.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();

const jwt = require('jsonwebtoken');
const http = require('https');

const userId = 'f7e073b4-5852-4891-90ca-717583994446';
const email = 'lakshaykaushik4605@gmail.com';
const role = 'ADMIN';

const jwtAccessSecret = 'c1a357f8674d89a1c8b7c93e4f01de58';

function signToken() {
  const payload = {
    sub: userId,
    email: email,
    role: role,
    type: 'access'
  };
  return jwt.sign(payload, jwtAccessSecret, { expiresIn: '15m' });
}

function fetchBrief(token) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Cookie': `accessToken=${token}`,
      }
    };

    const req = http.request('https://frontend-gamma-lovat-44.vercel.app/api/v1/reports/brief?range=month', options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => { reject(err); });
    req.end();
  });
}

async function run() {
  const token = signToken();
  console.log('Signed Access Token for user:', email);
  console.log('Fetching live brief...');
  try {
    const res = await fetchBrief(token);
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', res.body);
  } catch (err) {
    console.error('Error fetching brief:', err);
  }
}

run();

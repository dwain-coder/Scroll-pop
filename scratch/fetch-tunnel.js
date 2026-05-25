const http = require('https');

http.get('https://whole-ends-divide.loca.lt/health', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Body:', data.slice(0, 500));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});

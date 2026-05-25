const { spawn } = require('child_process');

function startTunnel() {
  console.log('Starting persistent localtunnel client...');
  
  // Use npx -y to auto-confirm package installation and force subdomain whole-ends-divide
  const lt = spawn('npx', ['-y', 'localtunnel', '--port', '3001', '--subdomain', 'whole-ends-divide'], {
    shell: true,
    env: process.env
  });

  lt.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(`[localtunnel]: ${text.trim()}`);
  });

  lt.stderr.on('data', (data) => {
    console.error(`[localtunnel err]: ${data.toString().trim()}`);
  });

  lt.on('close', (code) => {
    console.log(`localtunnel client exited with code ${code}. Restarting tunnel in 3 seconds...`);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();

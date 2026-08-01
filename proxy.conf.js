const { existsSync } = require('node:fs');
const { loadEnvFile } = require('node:process');

if (existsSync('.env')) {
  loadEnvFile('.env');
}

module.exports = {
  '/api': {
    target: process.env.API_TARGET ?? 'http://localhost:8080',
    secure: false,
    changeOrigin: true,
  },
};

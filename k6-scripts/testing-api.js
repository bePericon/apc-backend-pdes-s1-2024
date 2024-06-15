import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 4 },
    { duration: '30s', target: 10 },
    { duration: '5s', target: 0 },
  ],
};

const USERNAME = `ucomprador@email.com`; // Set your own email or `${randomString(10)}@example.com`;
const PASSWORD = '12345678';

const BASE_URL = 'https://apc-backend-pdes-s1-2024-production.up.railway.app';

export function setup() {
  const res = http.post(`${BASE_URL}/api/auth/login`, {
      username: USERNAME,
      password: PASSWORD,
  });
  const token = res.token;
  
  check(token, { 'logged in successfully': () => token !== '' });

  return token;
}

export default function (token) {
  const response = http.get(`${BASE_URL}/api/meli/search?q=monitor`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(response, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}

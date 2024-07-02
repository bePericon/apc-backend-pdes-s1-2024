import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '1m', target: 25 },
    { duration: '25s', target: 15 },
    { duration: '20s', target: 30 },
    { duration: '20s', target: 40 },
    { duration: '10s', target: 10 },
    { duration: '10s', target: 0 },
  ],
};

const EMAIL = `ucomprador@email.com`;
const PASSWORD = '12345678';

// const BASE_URL = 'https://apc-backend-pdes-s1-2024-production.up.railway.app';
const BASE_URL = 'http://host.docker.internal:8080';

export function setup() {
  const res = http.post(`${BASE_URL}/api/auth/login`, {
    email: EMAIL,
    password: PASSWORD,
  });
  const token = JSON.parse(res.body).data.token;

  check(token, { 'logged in successfully': () => token !== '' });

  return token;
}

const searchWords = [
  'monitor',
  'smartwatch',
  'ventana de aluminio',
  'block de hojas A4',
  'remera negra',
  'zapatillas deportivas',
];

export default function (token) {
  var randomNumber = Math.floor(Math.random() * searchWords.length);

  const response = http.get(
    `${BASE_URL}/api/meli/search?q=${searchWords[randomNumber]}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  check(response, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}

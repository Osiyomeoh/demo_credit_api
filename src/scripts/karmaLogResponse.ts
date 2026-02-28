import 'dotenv/config';
import axios from 'axios';

/**
 * Calls the Adjutor Karma API and logs the full response.
 * Usage: npm run karma:log [identity]
 * Example: npm run karma:log 0zspgifzbo.ga
 *          npm run karma:log user@example.com
 */
async function main() {
  const identity = process.argv[2] || '0zspgifzbo.ga';

  const baseUrl =
    process.env.ADJUTOR_KARMA_BASE_URL ||
    'https://adjutor.lendsqr.com/v2/verification/karma';
  const apiKey = process.env.ADJUTOR_API_KEY;

  if (!apiKey) {
    console.error('ADJUTOR_API_KEY is not set. Add it to .env');
    process.exit(1);
  }

  const url = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(identity)}`;
  console.log('Request:', { method: 'GET', url });
  console.log('---');

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    console.log('HTTP Status:', response.status, response.statusText);
    console.log('Response body (JSON):');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('HTTP Status:', error.response?.status ?? 'N/A');
      if (error.response?.data) {
        console.log('Response body:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('Error:', error.message);
    } else {
      console.error('Error:', (error as Error).message);
    }
    process.exit(1);
  }
}

void main();

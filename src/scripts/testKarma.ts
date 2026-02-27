import 'dotenv/config';
import { karmaService } from '../services/AdjutorKarmaService';

async function main() {
  const identity =
    process.argv[2] || '0zspgifzbo.ga'; // default sample from docs

  if (!process.env.ADJUTOR_API_KEY) {
    console.error(
      'ADJUTOR_API_KEY is not set. Please add it to your environment or .env file.'
    );
    process.exit(1);
  }

  console.log(`Checking Karma blacklist for identity: ${identity}`);

  try {
    const blacklisted = await karmaService.isBlacklisted(identity);
    if (blacklisted) {
      console.log(`RESULT: "${identity}" IS blacklisted in Karma.`);
    } else {
      console.log(`RESULT: "${identity}" is NOT blacklisted in Karma.`);
    }
  } catch (error) {
    console.error('Error while calling Karma API:', (error as Error).message);
    process.exit(1);
  }
}

void main();


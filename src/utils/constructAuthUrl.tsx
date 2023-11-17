import { StorageKeys } from '../types/chrome-storage';
import { ChromeStorage } from './syncChromeStorage';

const baseUrl =
  'https://accounts.zoho.eu/oauth/v2/token?client_id=1000.KAEQFH4H4AQQJ9SPYZLCBJHSVLMJJN&client_secret=fafe16f946273a78e5a99c9dac270e56f1b2b60426&code=1000.6ae5e62911d9035773a5131da90d0bbc.d8737f179eb16c5c2291e181fd72a88e&grant_type=authorization_code';

const constructAuthUrl = async () => {
  const credentials = await ChromeStorage.get(StorageKeys.CREDENTIALS);

//   for (const key of credentials) {

//   }

  console.log('credentials', credentials);
};

export { constructAuthUrl };

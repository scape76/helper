import { ProfileInfo } from '../types/chrome-storage';
import { MessageFrom, MessageSubject } from '../types/message';
import { constructAuthUrl } from '../utils/constructAuthUrl';
import { extractIdFromLinkedInURL } from '../utils/extractIdFromLinkedin';

console.info('contentScript is running');

console.log(window.location.pathname);

async function checkIfInCrm() {
  return new Promise((res, rej) => setTimeout(() => res(12323), 1000));
}
const url =
  'https://accounts.zoho.eu/oauth/v2/token?client_id=1000.KAEQFH4H4AQQJ9SPYZLCBJHSVLMJJN&client_secret=fafe16f946273a78e5a99c9dac270e56f1b2b60426&code=1000.6ae5e62911d9035773a5131da90d0bbc.d8737f179eb16c5c2291e181fd72a88e&grant_type=authorization_code';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  api_domain: string;
  expires_in: number;
}

async function getAuthTokens() {
  const response = (await fetch(url)) as unknown as AuthResponse;

  console.log(response);
}

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === MessageFrom.POPUP && msg.subject === MessageSubject.PROFILE_INFO) {
    const h1 = document.querySelector('h1');

    const name = h1?.innerText;

    console.log('name', name);

    checkIfInCrm().then((res) => {
      const id = extractIdFromLinkedInURL(window.location.href);

      constructAuthUrl();

      if (!id) {
        throw new Error("Coldn't extract id from the current user's profile");
      }

      const profileInfo: ProfileInfo = {
        displayName: name ?? 'Anonymous',
        id,
      };

      response(profileInfo);
    });

    return true;
  }
});

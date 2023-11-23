import { ErrorTypes, ProfileInfo, StorageKeys, MessageFrom, MessageSubject } from '@/types';
import { ChromeStorage } from './chrome-storage';
import { Message } from 'postcss';
import { catchZohoError } from './utils';

interface ZohoMessage {
  email: string;
  subject: string;
  message: string;
  firstName: string;
  lastName: string;
}

async function getCredentials() {
  return ChromeStorage.get(StorageKeys.CREDENTIALS);
}

const ZOHO_ACCOUNTS_DOMAIN = 'https://accounts.zoho.eu';
const ZOHO_API_DOMAIN = 'https://www.zohoapis.eu';

async function getAuthTokens(from?: MessageFrom) {
  const credentials = await getCredentials();
  if (!credentials) return catchZohoError({ error: 'missing_credentials', to: from });
  try {
    const url = `${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token?client_id=${credentials.clientId}&client_secret=${credentials.clientSecret}&code=${credentials.code}&grant_type=authorization_code`;
    const res = await fetch(url, {
      method: 'POST',
    });

    const body = await res.json();

    // it may return 200 res with an error
    if (body.error) {
      return catchZohoError({ error: body.error, to: from });
    }

    const accessToken = `${body.token_type} ${body.access_token}`;
    const refreshToken = body.refresh_token;

    const newCreds = { ...credentials, accessToken, refreshToken };

    ChromeStorage.set({ credentials: newCreds });

    return newCreds;
  } catch (err) {
    chrome.runtime.sendMessage({
      from: MessageFrom.BACKGROUND,
      subject: MessageSubject.FETCH_ERROR,
      error: { type: ErrorTypes.fetchError, message: err },
    });
  }
}

async function getContactByFullname(fullName: string, depth: number = 0) {
  if (depth > 1) {
    catchZohoError({ error: 'Too many requests' });
    return;
  }

  const credentials = await getCredentials();

  if (!credentials) return catchZohoError({ error: 'missing_credentials' });

  if (credentials?.accessToken?.length === 0) {
    const isTokenRetrieved = await refreshToken();
    if (isTokenRetrieved) {
      return getContactByFullname(fullName, depth + 1);
    } else {
      return;
    }
  }

  const [firstName, lastName] = fullName.split(' ');

  const res = await fetch(
    `${ZOHO_API_DOMAIN}/bigin/v1/Contacts/search?criteria=((Last_Name:equals:${lastName})and(First_Name:equals:${firstName}))`,
    {
      headers: {
        Authorization: `${credentials.accessToken}`,
      },
    },
  );

  const string = await res.text();
  const body = string === '' ? {} : JSON.parse(string);

  if (res.status === 401) {
    const isTokenRetrieved = await refreshToken();

    if (isTokenRetrieved) {
      return getContactByFullname(fullName, depth + 1);
    }

    return catchZohoError(body.error);
  }

  return body.data?.[0];
}

async function createContact(profile: ProfileInfo, depth: number = 0) {
  if (depth > 1) {
    catchZohoError({ error: 'Too many requests' });
    return;
  }

  const credentials = await getCredentials();

  if (!credentials) return catchZohoError({ error: 'missing_credentials' });

  if (credentials?.accessToken?.length === 0) {
    const isTokenRetrieved = await refreshToken();
    if (isTokenRetrieved) {
      return createContact(profile, depth + 1);
    } else {
      return;
    }
  }

  const [firstName, lastName] = profile.displayName.split(' ');

  const res = await fetch(`${ZOHO_API_DOMAIN}/bigin/v1/Contacts`, {
    method: 'POST',
    headers: {
      Authorization: `${credentials.accessToken}`,
    },
    body: JSON.stringify({
      data: [
        {
          First_Name: firstName,
          Last_Name: lastName,
          Description: profile.description,
          Email: profile.email,
        },
      ],
    }),
  });

  const string = await res.text();
  const body = string === '' ? {} : JSON.parse(string);

  if (res.status === 401) {
    const isTokenRetrieved = await refreshToken();

    if (isTokenRetrieved) {
      return createContact(profile, depth + 1);
    }

    return catchZohoError(body.error);
  }

  return body.data?.[0];
}

async function deleteContact(id: string, depth: number = 0) {
  if (depth > 1) {
    catchZohoError({ error: 'Too many requests' });
    return;
  }

  const credentials = await getCredentials();

  if (!credentials) return catchZohoError({ error: 'missing_credentials' });

  if (credentials?.accessToken?.length === 0) {
    const isTokenRetrieved = await refreshToken();
    if (isTokenRetrieved) {
      return deleteContact(id, depth + 1);
    } else {
      return;
    }
  }

  const res = await fetch(`${ZOHO_API_DOMAIN}/bigin/v1/Contacts/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${credentials.accessToken}`,
    },
  });

  const string = await res.text();
  const body = string === '' ? {} : JSON.parse(string);

  if (res.status === 401) {
    const isTokenRetrieved = await refreshToken();

    if (isTokenRetrieved) {
      return deleteContact(id, depth + 1);
    }

    return catchZohoError(body.error);
  }

  return body.data?.[0];
}

async function refreshToken() {
  const credentials = await getCredentials();

  if (!credentials) return;

  const url = `${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token?refresh_token=${credentials.refreshToken}&client_id=${credentials.clientId}&client_secret=${credentials.clientSecret}&grant_type=refresh_token`;
  const res = await fetch(url, {
    method: 'POST',
  });

  const body = await res.json();

  if (res.status === 401 || res.status === 400 || res.status === 403) {
    catchZohoError(body.error);
    return false;
  }

  const accessToken = `${body.token_type} ${body.access_token}`;
  ChromeStorage.set({
    credentials: { ...credentials, accessToken },
  });
  return true;
}

export { getAuthTokens, getContactByFullname, createContact, deleteContact };

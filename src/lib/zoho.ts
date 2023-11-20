import { ErrorTypes, ProfileInfo, StorageKeys, MessageFrom, MessageSubject } from '@/types';
import { ChromeStorage } from './chrome-storage';
import { Message } from 'postcss';

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

function catchZohoError({
  error,
  description,
  to,
}: {
  error: string;
  description?: string;
  to?: MessageFrom;
}) {
  const message =
    description ?? zohoErrorToMessage[error] ?? 'Something went wrong, please try again later';
  chrome.runtime.sendMessage({
    from: MessageFrom.BACKGROUND,
    subject: MessageSubject.FETCH_ERROR,
    to,
    error: {
      type: ErrorTypes.fetchError,
      message,
    },
  });
}

async function getAuthTokens(from?: MessageFrom) {
  const credentials = await getCredentials();
  if (!credentials) return catchZohoError({ error: 'missing_credentials', to: from });
  try {
    const url = `https://accounts.zoho.eu/oauth/v2/token?client_id=${credentials.clientId}&client_secret=${credentials.clientSecret}&code=${credentials.code}&grant_type=authorization_code`;
    console.log('url', url);
    const res = await fetch(url, {
      method: 'POST',
    });
    const body = await res.json();

    console.log('body', body);

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

async function getContacts(depth: number = 0) {
  if (depth > 1) {
    catchZohoError({ error: 'Too many requests' });
    return;
  }
  const credentials = await getCredentials();
  if (!credentials) return catchZohoError({ error: 'missing_credentials' });
  try {
    // if (credentials?.accessToken?.length === 0) await refreshToken();

    console.log('creds', credentials);
    if (credentials.accessToken?.length === 0) {
      const isTokenRetrieved = await refreshToken();
      if (isTokenRetrieved) {
        return getContacts(depth + 1);
      } else {
        return;
      }
    }

    const res = await fetch('https://www.zohoapis.eu/bigin/v1/Contacts', {
      headers: {
        Authorization: `${credentials.accessToken}`,
      },
    });

    const body = await res.json();

    if (body.code === 'INVALID_TOKEN' || body.code === 'AUTHENTICATION_FAILURE') {
      const isTokenRetrieved = await refreshToken();
      console.log('is token retreived', isTokenRetrieved);
      if (isTokenRetrieved) {
        return getContacts(depth + 1);
      }
      throw new Error(body.error ?? 'Authentication failed');
    }

    if (body.error) {
      return catchZohoError(body.error);
    }

    return body.data;
  } catch (e) {
    if (e instanceof Error) {
      catchZohoError({ error: e.message });
    }

    catchZohoError({ error: 'Something went wrong' });
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

  console.log(credentials);

  console.log(firstName, lastName);

  const res = await fetch(
    `https://www.zohoapis.eu/bigin/v1/Contacts/search?criteria=((Last_Name:equals:${lastName})and(First_Name:equals:${firstName}))`,
    {
      headers: {
        Authorization: `${credentials.accessToken}`,
      },
    },
  );

  console.log('response', res);

  const string = await res.text();
  const body = string === '' ? {} : JSON.parse(string);

  console.log('body', body);

  if (body.code === 'INVALID_TOKEN' || body.code === 'AUTHENTICATION_FAILURE') {
    const isTokenRetrieved = await refreshToken();
    console.log('is token retreived', isTokenRetrieved);

    if (isTokenRetrieved) {
      return getContactByFullname(fullName, depth + 1);
    }

    return catchZohoError(body.error);
  }

  if (body.error) {
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

  const res = await fetch(`https://www.zohoapis.eu/bigin/v1/Contacts`, {
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

  console.log('response', res);

  const string = await res.text();
  const body = string === '' ? {} : JSON.parse(string);

  console.log('body', body);

  if (body.code === 'INVALID_TOKEN' || body.code === 'AUTHENTICATION_FAILURE') {
    const isTokenRetrieved = await refreshToken();
    console.log('is token retreived', isTokenRetrieved);

    if (isTokenRetrieved) {
      return createContact(profile, depth + 1);
    }

    return catchZohoError(body.error);
  }

  if (body.error || body.status === 'error') {
    return catchZohoError(body.error || body.code);
  }

  return body.data?.[0];
}

async function refreshToken() {
  const credentials = await getCredentials();
  if (!credentials) return;
  try {
    // Make a POST request to Zoho token endpoint to refresh the access token
    const url = `https://accounts.zoho.eu/oauth/v2/token?refresh_token=${credentials.refreshToken}&client_id=${credentials.clientId}&client_secret=${credentials.clientSecret}&grant_type=refresh_token`;
    const res = await fetch(url, {
      method: 'POST',
    });
    const body = await res.json();

    console.log('body in refresh', body);

    if (body.error) {
      catchZohoError({ error: body.error, description: body.error_description });
      return false;
    }

    const accessToken = `${body.token_type} ${body.access_token}`;
    ChromeStorage.set({
      credentials: { ...credentials, accessToken },
    });
    return true;
  } catch (e) {
    return false;
  }
}

const zohoErrorToMessage: Record<string, string> = {
  invalid_code: 'Invalid credentials',
  missing_credentials: 'Credentials not set',
  OAUTH_SCOPE_MISMATCH:
    'Missing necessary permissions to create a new record. Please, provide a new code with ZohoBigin.modules.Contacts.CREATE,ZohoSearch.securesearch.READ,ZohoBigin.modules.Contacts.READ',
};

const biginDomain = 'https://accounts.zoho.eu';

export { getAuthTokens, getContactByFullname, getContacts, createContact };

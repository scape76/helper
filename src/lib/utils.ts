import { ErrorTypes, MessageFrom, MessageSubject } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function extractIdFromLinkedInURL(url: string) {
  const startIndex = url.indexOf('in/') + 3; // Adding 3 to skip 'in/'
  const endIndex = url.lastIndexOf('/'); // Finding the last '/'

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return url.substring(startIndex, endIndex);
  } else {
    return null; // Return null if the pattern is not found
  }
}

const zohoErrorToMessage: Record<string, string> = {
  invalid_code: 'Invalid credentials',
  missing_credentials: 'Credentials not set',
  OAUTH_SCOPE_MISMATCH:
    'Missing necessary permissions to create a new record. Please, provide a new code with ZohoBigin.modules.Contacts.CREATE,ZohoSearch.securesearch.READ,ZohoBigin.modules.Contacts.READ',
};

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

export { extractIdFromLinkedInURL, cn, catchZohoError };

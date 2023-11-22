import { ErrorTypes, MessageFrom, MessageSubject, ProfileInfo } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { linkedInProfilePageConfig, linkedInProfileUrlRegex } from '@/lib/config';
import { icons } from 'lucide-react';

const {
  avatarElementSelectors,
  closeContactInfoElement,
  emailElement: emailElementSelector,
  contactInfoElement: contactInfoElementSelector,
  nameElementSelectors,
} = linkedInProfilePageConfig;

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
  AUTHENTICATION_FAILED: "Zoho client wasn't initialized.",
  INVALID_TOKEN: 'Something went wrong, please try re-initalizing zoho client.',
  FEATURE_NOT_SUPPORTED: 'This feature is not supported.',
  NO_PERMISSION: 'You have no permissions to do that',
  INVALID_MODULE: 'Invalid module provided in configuration',
  INVALID_DATA: 'Invalid data provided',
  DUPLICATE_DATA: 'Provided data is a duplicate',
  MANDATORY_NOT_FOUND: "Primary key wasn't provided",
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

const getElementBySelectors = <T>(...args: string[]): T | null => {
  for (const selector of args) {
    const element = document.querySelector(selector) as T;
    if (element) return element;
  }

  return null;
};

const getUserProfileInfo = async (): Promise<ProfileInfo | null | undefined> => {
  return new Promise((res, rej) => {
    const contextUrl = window.location.href;

    const bodyList = getElementBySelectors<HTMLBodyElement>('body');

    if (!bodyList) return null;

    let h1 = getElementBySelectors<HTMLHeadingElement>(
      nameElementSelectors.website,
      nameElementSelectors.app,
    );

    let name = h1?.innerText ?? 'Anonymous';

    const avatarImgElement = getElementBySelectors<HTMLImageElement>(
      avatarElementSelectors.website,
      avatarElementSelectors.app(name),
    );

    const avatarUrl = avatarImgElement?.src;

    const id = extractIdFromLinkedInURL(contextUrl) ?? '';

    const observer = new MutationObserver(() => {
      const sectionElement = document.querySelector('section.pv-profile-section');

      if (contextUrl !== window.location.href && sectionElement) {
        const emailElement = getElementBySelectors<HTMLAnchorElement>(emailElementSelector);
        const email = emailElement?.innerText;

        const closeElement = getElementBySelectors<HTMLButtonElement>(closeContactInfoElement);
        closeElement?.click();

        const profileInfo: ProfileInfo = {
          displayName: name ?? 'Anonymous',
          email,
          avatarUrl,
          id,
          description: contextUrl,
        };

        observer.disconnect();

        res(profileInfo);
      }
    });

    observer.observe(bodyList, { childList: true, subtree: true });

    const contactInfoElement = getElementBySelectors<HTMLAnchorElement>(
      contactInfoElementSelector(id),
    );

    if (!contactInfoElement) {
      res({
        displayName: name ?? 'Anonymous',
        avatarUrl,
        description: contextUrl,
        id,
      });
    }

    contactInfoElement?.click();
  });
};

const isProfileContactInfoPage = (profileUrl: string, contactInfo: string): boolean => {
  const profileBaseUrl = profileUrl.split('?')[0];

  const contactBaseUrl = contactInfo.split('/overlay/contact-info/')[0];

  return contactBaseUrl.includes(profileBaseUrl) || profileBaseUrl.includes(contactBaseUrl);
};

export {
  extractIdFromLinkedInURL,
  cn,
  catchZohoError,
  getElementBySelectors,
  getUserProfileInfo,
  isProfileContactInfoPage,
};

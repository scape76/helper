import { ErrorTypes, ProfileInfo, MessageFrom, MessageSubject } from '@/types';
import { extractIdFromLinkedInURL } from '@/lib/utils';
import { linkedInProfilePageConfig, linkedInProfileUrlRegex } from '@/lib/config';

const {
  avatarElementSelectors,
  closeContactInfoElement,
  emailElement: emailElementSelector,
  contactInfoElement: contactInfoElementSelector,
  nameElementSelectors,
} = linkedInProfilePageConfig;

console.info('contentScript is running');

const getElementBySelectors = <T>(...args: string[]): T | null => {
  for (const selector of args) {
    const element = document.querySelector(selector) as T;
    if (element) return element;
  }

  return null;
};

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === MessageFrom.POPUP && msg.subject === MessageSubject.PROFILE_INFO) {
    const contextUrl = window.location.href;

    if (!linkedInProfileUrlRegex.test(contextUrl)) {
      response({
        type: ErrorTypes.invalidUrl,
        message: "It doesn't look like you are on a LinkedIn profile page.",
      });
    }

    const bodyList = getElementBySelectors<HTMLBodyElement>('body');

    if (!bodyList) return;

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

    const id = extractIdFromLinkedInURL(contextUrl);

    const observer = new MutationObserver(() => {
      if (contextUrl !== window.location.href) {
        const emailElement = getElementBySelectors<HTMLAnchorElement>(emailElementSelector);
        const email = emailElement?.innerText;

        const closeElement = getElementBySelectors<HTMLButtonElement>(closeContactInfoElement);
        closeElement?.click();

        const profileInfo: ProfileInfo = {
          displayName: name ?? 'Anonymous',
          email,
          avatarUrl,
          id: id ?? '',
          description: contextUrl,
        };

        observer.disconnect();

        response(profileInfo);
      }
    });

    observer.observe(bodyList, { childList: true, subtree: true });

    const contactInfoElement = getElementBySelectors<HTMLAnchorElement>(contactInfoElementSelector);

    if (!contactInfoElement) {
      response({
        displayName: name ?? 'Anonymous',
        avatarUrl,
        id: id ?? '',
        description: contextUrl,
      });
    }

    contactInfoElement?.click();

    return true;
  }
});

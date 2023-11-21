import { ErrorTypes, ProfileInfo, MessageFrom, MessageSubject } from '@/types';
import { extractIdFromLinkedInURL } from '@/lib/utils';

console.info('contentScript is running');

const linkedinRegex = /^https:\/\/www\.linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === MessageFrom.POPUP && msg.subject === MessageSubject.PROFILE_INFO) {
    const contextUrl = window.location.href;

    if (!linkedinRegex.test(contextUrl)) {
      response({
        type: ErrorTypes.invalidUrl,
        message: "It doesn't look like you are on a LinkedIn profile page.",
      });
    }

    const bodyList = document.querySelector('body');

    if (!bodyList) return;

    const h1 = (document.querySelector('h1.text-heading-xlarge') ??
      document.querySelector('h1.heading-large')) as HTMLHeadingElement;
    const name = h1?.innerText;
    const avatarImgElement = (document.querySelector('img[data-show-modal="true"]') ??
      document.querySelector(`img[title="${name}"]`)) as HTMLImageElement;

    const avatarUrl = avatarImgElement?.src;

    const id = extractIdFromLinkedInURL(contextUrl);

    const observer = new MutationObserver(() => {
      if (contextUrl !== window.location.href) {
        const emailElement = document.querySelector('a[href*="mailto"]') as HTMLAnchorElement | null;
        const email = emailElement?.innerText;

        const closeElement = document.querySelector(
          'button[aria-label="Dismiss"]',
        ) as HTMLButtonElement;
        closeElement.click();

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

    const contactInfoElement = document.querySelector(
      `a[href="/in/${id}/overlay/contact-info/"]`,
    ) as HTMLAnchorElement;

    if (!contactInfoElement) {
      response({
        displayName: name ?? 'Anonymous',
        avatarUrl,
        id: id ?? '',
        description: contextUrl,
      });
    }
    contactInfoElement?.click();

    if (!id) {
      throw new Error("Coldn't extract id from the current user's profile");
    }

    return true;
  }
});

const linkedInProfilePageConfig = {
  nameElementSelectors: {
    website: 'h1.text-heading-xlarge',
    app: 'h1.heading-large',
  },
  avatarElementSelectors: {
    website: 'img[data-show-modal="true"]',
    app: (name: string) => `img[title="${name}"]`,
  },
  contactInfoElement: (id: string) => `a[href="/in/${id}/overlay/contact-info/"]`,
  emailElement: "a[href*='mailto']",
  closeContactInfoElement: 'button[aria-label="Dismiss"]',
};

const linkedInProfileUrlRegex = /^https:\/\/www\.linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;

export { linkedInProfilePageConfig, linkedInProfileUrlRegex };

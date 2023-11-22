import React from 'react';
import { type Root, createRoot } from 'react-dom/client';
import App from './App';
import { getElementBySelectors, isProfileContactInfoPage } from '@/lib/utils';
import './main.css';

let body: HTMLDivElement | null;
let root: Root | null;
let bodyList;

const config = {
  childList: true,
  subtree: true,
};

let previousUrl = '';
const observer = new MutationObserver((mutations) => {
  body = getElementBySelectors<HTMLDivElement>(
    '.MaviszEJVEcLnQUlFveFTDDMDVYOpHbcIKJOgVaQ',
    'dt.flex.items-center',
  );

  if (
    location.href !== previousUrl &&
    !isProfileContactInfoPage(previousUrl, location.href) &&
    body
  ) {
    bodyList = document.querySelector('body');

    previousUrl = location.href;
    root?.unmount();

    if (!body) return;

    const app = document.createElement('div');

    app.id = 'crm-extension-root';

    if (body) {
      body.append(app);
      body.classList.add('react-style-reset');
    }

    const container = document.getElementById('crm-extension-root');
    root = createRoot(container!);

    root.render(<App key={location.href} />);

    observer.disconnect();

    if (bodyList) observer.observe(bodyList, config);
  }
});

window.addEventListener('load', () => {
  previousUrl = location.href;

  bodyList = document.querySelector('body');

  body = getElementBySelectors<HTMLDivElement>(
    '.MaviszEJVEcLnQUlFveFTDDMDVYOpHbcIKJOgVaQ',
    'dt.flex.items-center',
  );

  if (!body) return;

  const app = document.createElement('div');

  app.id = 'crm-extension-root';

  if (body) {
    body.append(app);
    body.classList.add('react-style-reset');
  }

  const container = document.getElementById('crm-extension-root');
  root = createRoot(container!);

  root.render(<App key={location.href} />);

  if (bodyList) observer.observe(bodyList, config);
});

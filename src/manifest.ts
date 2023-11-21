import { defineManifest } from '@crxjs/vite-plugin';
import packageData from '../package.json';

export default defineManifest({
  name: packageData.name,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  host_permissions: ['https://*/'],
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-34.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo-48.png',
  },
  background: {
    service_worker: 'src/app/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      run_at: 'document_end',
      matches: ['https://*/*', 'https://www.linkedin.com/in/**/*'],
      js: ['src/app/contentScript/index.ts'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png'],
      matches: [],
    },
  ],
  permissions: ['sidePanel', 'storage'],
  // chrome_url_overrides: {
  //   newtab: 'newtab.html',
  // },
});

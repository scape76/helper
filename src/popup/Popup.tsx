import { useState, useEffect } from 'react';

import './Popup.css';
import { MessageSubject, MessageFrom } from '../types/message';
import { Credentials, ProfileInfo } from '../types/chrome-storage';

export const Popup = () => {
  const [credentials, setCredentials] = useState<Credentials | null>({
    code: '',
    clientId: '',
    clientSecret: '',
  });
  const [name, setName] = useState<string>('');
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>();

  console.log(credentials);

  useEffect(() => {
    chrome.storage.sync.get(['credentials'], (result) => {
      setCredentials(result.credentials);
    });
  }, []);

  useEffect(() => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id ?? 1,
          { from: MessageFrom.POPUP, subject: MessageSubject.PROFILE_INFO },
          (info) => {
            console.log('info', info);
            setProfileInfo(info);
            chrome.storage.sync.set({ profileInfo });
          },
        );
      },
    );
  }, []);

  return (
    <main>
      Your zoho bigin credentials
      <h2>Client id</h2>
      <input
        type="text"
        value={credentials?.clientId}
        onChange={(e) => setCredentials((prev) => ({ ...(prev ?? {}), clientId: e.target.value }))}
      />
      <h2>Client secret</h2>
      <input
        type="text"
        value={credentials?.clientSecret}
        onChange={(e) =>
          setCredentials((prev) => ({ ...(prev ?? {}), clientSecret: e.target.value }))
        }
      />
      <h2>Code</h2>
      <input
        type="text"
        value={credentials?.code}
        onChange={(e) => setCredentials((prev) => ({ ...(prev ?? {}), code: e.target.value }))}
      />
      <button
        onClick={() => {
          console.log('in here', credentials);
          chrome.storage.sync.set({ credentials });
        }}
      >
        Save
      </button>
      <h3>{profileInfo?.displayName}</h3>
      <h1>{name}</h1>
    </main>
  );
};

export default Popup;

import { useCallback, useEffect, useState } from 'react';
import { getUserProfileInfo } from '@/lib/utils';
import {
  CRMQueryStatusResponse,
  ContactQueryStatus,
  ErrorMessage,
  MessageFrom,
  MessageSubject,
  ProfileInfo,
} from '@/types';
import { Loader2 } from 'lucide-react';
import './App.css';
import { linkedInProfileUrlRegex } from '@/lib/config';
import { useHref } from '@/hooks/useHref';

function App() {
  const href = useHref();

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>();
  const [error, setError] = useState<ErrorMessage>();
  const [crmQueryStatus, setCRMQueryStatus] = useState<CRMQueryStatusResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const searchForCRMRecord = () => {
    if (!profileInfo) return;
    setError(undefined);
    setIsLoading(true);
    chrome.runtime.sendMessage(
      {
        from: MessageFrom.POPUP,
        subject: MessageSubject.INFO_QUERY,
        payload: {
          fullName: profileInfo.displayName,
        },
      },
      (response: CRMQueryStatusResponse) => {
        setCRMQueryStatus(response);
        setIsLoading(false);
        if (typeof response === 'object' && 'message' in response) {
          setError(response);
        }
      },
    );
  };

  const getProfileInfo = () => {
    if (!linkedInProfileUrlRegex.test(window.location.href)) return;

    (async () => {
      const profileInfo = await getUserProfileInfo();
      if (profileInfo) setProfileInfo(profileInfo);
      searchForCRMRecord();
    })();
  };

  useEffect(() => {
    if (!profileInfo) return;
    searchForCRMRecord();
  }, [profileInfo]);

  const createCRMRecord = useCallback(() => {
    if (!profileInfo) return;
    setError(undefined);
    setIsCreating(true);
    chrome.runtime.sendMessage(
      {
        from: MessageFrom.POPUP,
        subject: MessageSubject.CREATE_RECORD,
        payload: {
          profile: { ...profileInfo },
        },
      },
      (response: CRMQueryStatusResponse) => {
        setCRMQueryStatus(response);
        setIsCreating(false);
        if (typeof response === 'object' && 'message' in response) {
          setError(response);
        }
      },
    );
  }, [profileInfo]);

  useEffect(() => {
    if (href.includes('overlay/contact-info')) return;
    getProfileInfo();
  }, [href]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
      if (msg.from === MessageFrom.BACKGROUND && msg.subject === MessageSubject.FETCH_ERROR) {
        setError(msg.error);
        response();
      }
    });
  }, []);

  return (
    <div className="container">
      {isLoading && <Loader2 className="icon animate-spin" />}
      {crmQueryStatus === ContactQueryStatus.notFound && (
        <>
          <span className="status-info">There is no related record in CRM</span>
          <button onClick={() => createCRMRecord()} className="btn ml-2">
            {isCreating && <Loader2 className="icon animate-spin" />}
            Create
          </button>
        </>
      )}
      {crmQueryStatus === ContactQueryStatus.found && (
        <span className="status-info">Contact already exists in CRM</span>
      )}
      {crmQueryStatus === ContactQueryStatus.created && (
        <span className="status-info">Successfully created a new record</span>
      )}
      <span className="error-message">{error?.message}</span>
    </div>
  );
}

export default App;

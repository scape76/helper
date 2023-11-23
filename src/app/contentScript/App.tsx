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
import { Check, Loader2, Trash2 } from 'lucide-react';
import './App.css';
import { linkedInProfileUrlRegex } from '@/lib/config';
import { useHref } from '@/hooks/useHref';

function App() {
  const href = useHref();

  const [contactId, setContactId] = useState<string>();
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>();
  const [error, setError] = useState<ErrorMessage>();
  const [crmQueryStatus, setCRMQueryStatus] = useState<ContactQueryStatus>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
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
        setIsLoading(false);
        if (typeof response === 'object' && 'message' in response) {
          setError(response);
        } else {
          setCRMQueryStatus(response.status);
          setContactId(response.payload.id);
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
        setIsCreating(false);
        if (typeof response === 'object' && 'message' in response) {
          setError(response);
        } else {
          setCRMQueryStatus(response.status);
        }
      },
    );
  }, [profileInfo]);

  const deleteCRMRecord = useCallback(() => {
    if (!contactId) return;
    setError(undefined);
    setIsDeleting(true);
    chrome.runtime.sendMessage(
      {
        from: MessageFrom.SCRIPT,
        subject: MessageSubject.DELETE_RECORD,
        payload: {
          id: contactId,
        },
      },
      (response: CRMQueryStatusResponse) => {
        setIsDeleting(false);
        if (typeof response === 'object' && 'message' in response) {
          setError(response);
        } else {
          setCRMQueryStatus(response.status);
        }
      },
    );
  }, [contactId]);

  useEffect(() => {
    if (href.includes('overlay/contact-info')) return;
    setCRMQueryStatus(undefined);
    getProfileInfo();
  }, [href]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
      if (msg.subject === MessageSubject.FETCH_ERROR) {
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
      {crmQueryStatus === ContactQueryStatus.found && contactId && (
        <span className="status-info flex">
          Contact already exists in CRM <Check className="icon success" />
          <button onClick={() => deleteCRMRecord()} className="btn ml-2">
            {isDeleting ? <Loader2 className="icon animate-spin" /> : <Trash2 className="icon" />}
            Delete
          </button>
        </span>
      )}
      {crmQueryStatus === ContactQueryStatus.deleted && (
        <span className="status-info flex">
          Successfully deleted a record <Check className="icon success" />
        </span>
      )}
      {crmQueryStatus === ContactQueryStatus.created && (
        <span className="status-info flex">
          Successfully created a new record <Check className="icon success" />
        </span>
      )}
      <span className="error-message">{error?.message}</span>
    </div>
  );
}

export default App;

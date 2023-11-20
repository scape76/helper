import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CRMQueryStatusResponse,
  CRMInfoResponse,
  ErrorMessage,
  ProfileInfo,
  ProfileInfoResponse,
  MessageFrom,
  MessageSubject,
} from '@/types';
import { AlertTriangle, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const getProfileInfoFromContent = async (): Promise<ProfileInfoResponse> => {
  return new Promise((res, rej) => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id!,
          { from: MessageFrom.POPUP, subject: MessageSubject.PROFILE_INFO },
          (info) => {
            res(info);
          },
        );
      },
    );
  });
};

export const Profile = () => {
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>();
  const [error, setError] = useState<ErrorMessage>();
  const [crmQueryStatus, setCRMQueryStatus] = useState<CRMQueryStatusResponse>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  console.log(profileInfo, error);

  const searchForCRMRecord = useCallback(() => {
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
        console.log('RECEIVED CONTACTS', response);
        setCRMQueryStatus(response);
        setIsLoading(false);
        if (typeof response === 'object' && 'message' in response) {
          setError(response);
        }
      },
    );
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
        console.log('RECEIVED CONTACTS', response);
        setCRMQueryStatus(response);
        setIsCreating(false);
        if (typeof response === 'object' && 'message' in response) {
          setError(response);
        }
      },
    );
  }, [profileInfo]);

  useEffect(() => {
    if (error || profileInfo) return;
    (async () => {
      const res = await getProfileInfoFromContent();

      if (!res) {
        return;
      }

      if ('message' in res) {
        setError(res);
        return;
      }

      setProfileInfo(res);
    })();
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
      if (msg.from === MessageFrom.BACKGROUND && msg.subject === MessageSubject.FETCH_ERROR) {
        setError(msg.error);
        response();
      }
    });
  }, []);

  if (error?.type === 'INVALID_URL') {
    return (
      <div className="w-full flex flex-col items-center gap-4">
        <AlertTriangle className="w-24 h-24 text-muted-foreground" />
        <h1 className="text-xl text-center">{error.message}</h1>
      </div>
    );
  }

  return (
    <div>
      {profileInfo ? (
        <div className="w-full flex flex-col items-center gap-4">
          <Avatar className="w-24 h-24">
            {profileInfo.avatarUrl?.startsWith('https') && (
              <AvatarImage src={profileInfo?.avatarUrl} />
            )}
            <AvatarFallback className="text-lg">
              {profileInfo.displayName.split(' ')?.[0]?.[0] +
                profileInfo.displayName.split(' ')?.[1]?.[0]}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl text-center">{profileInfo?.displayName}</h1>
          {!crmQueryStatus && (
            <Button variant={'outline'} onClick={() => searchForCRMRecord()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Look for record in CRM
            </Button>
          )}
          {crmQueryStatus === 'NOT_FOUND' && (
            <>
              <span className="text-muted-foreground">
                There is no related record in CRM, do you want to create one?
              </span>
              <Label htmlFor="email" className="self-start">
                Email
              </Label>
              <Input
                id="email"
                value={profileInfo.email ?? ''}
                onChange={() =>
                  setProfileInfo(
                    (prev) =>
                      ({
                        ...prev,
                        email: profileInfo.email,
                      }) as Required<ProfileInfo>,
                  )
                }
              />
              <Label htmlFor="description" className="self-start">
                Description
              </Label>
              <Textarea
                id="description"
                value={profileInfo.description ?? ''}
                onChange={() =>
                  setProfileInfo(
                    (prev) =>
                      ({
                        ...prev,
                        email: profileInfo.description,
                      }) as Required<ProfileInfo>,
                  )
                }
              />
              <Button variant={'outline'} onClick={() => createCRMRecord()} className="w-full">
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </>
          )}

          {crmQueryStatus === 'FOUND' && (
            <>
              <span className="text-[0.8rem] text-muted-foreground text-center">
                Contact with the full name of {profileInfo.displayName} already exists in CRM
              </span>
            </>
          )}

          {crmQueryStatus === 'CREATED' && (
            <span className="text-muted-foreground">Successfully created a new record</span>
          )}

          <span className="text-[0.8rem] font-medium text-destructive break-all">
            {error?.message}
          </span>
        </div>
      ) : null}
    </div>
  );
};

import { CRMInfoResponse, Credentials, ErrorTypes, StorageKeys } from '@/types';
import { MessageFrom, MessageSubject } from '@/types/message';
import { ChromeStorage } from '@/lib/chrome-storage';
import { createContact, getAuthTokens, getContactByFullname, getContacts } from '@/lib/zoho';

console.log('background is running');

const getCredentials = async () => {
  return ChromeStorage.get(StorageKeys.CREDENTIALS);
};

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === MessageFrom.POPUP && msg.subject === MessageSubject.INFO_QUERY) {
    getCredentials().then((credentials) => {
      if (!credentials) {
        return response({ message: 'Credentials not set!', type: ErrorTypes.undefinedCredentials });
      }

      if (!msg.payload.fullName) return response(null);

      getContactByFullname(msg.payload.fullName).then((contact) => {
        if (contact) {
          response('FOUND');
        }

        response('NOT_FOUND');
      });
    });

    return true;
  }

  if (msg.from === MessageFrom.POPUP && msg.subject === MessageSubject.CREATE_RECORD) {
    getCredentials().then(async (credentials) => {
      if (!credentials) {
        return response({ message: 'Credentials not set!', type: ErrorTypes.undefinedCredentials });
      }

      if (!msg.payload.profile) return response(null);

      const data = await createContact(msg.payload.profile);

      if (data) {
        response('CREATED');
      }

      response('ERROR');
    });

    return true;
  }

  if (msg.from === MessageFrom.CONFIG && msg.subject === MessageSubject.CREDENTIALS_SET) {
    getAuthTokens(msg.from).then((res) => {
      response(res);
    });

    return true;
  }

  response();
});

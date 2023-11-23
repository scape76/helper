import { CRMInfoResponse, ContactQueryStatus, Credentials, ErrorTypes, StorageKeys } from '@/types';
import { MessageFrom, MessageSubject } from '@/types/message';
import { ChromeStorage } from '@/lib/chrome-storage';
import { createContact, deleteContact, getAuthTokens, getContactByFullname } from '@/lib/zoho';

console.log('background is running');

const getCredentials = async () => {
  return ChromeStorage.get(StorageKeys.CREDENTIALS);
};

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (
    (msg.from === MessageFrom.POPUP || msg.from === MessageFrom.SCRIPT) &&
    msg.subject === MessageSubject.INFO_QUERY
  ) {
    getCredentials().then((credentials) => {
      if (!credentials) {
        return response({ message: 'Credentials not set!', type: ErrorTypes.undefinedCredentials });
      }

      if (!msg.payload.fullName) {
        return response({
          message: 'No display name provided',
          type: ErrorTypes.undefinedCredentials,
        });
      }

      getContactByFullname(msg.payload.fullName).then((contact) => {
        if (contact) {
          response({ status: ContactQueryStatus.found, payload: { id: contact.id } });
        }

        response({ status: ContactQueryStatus.notFound });
      });
    });

    return true;
  }

  if (msg.subject === MessageSubject.CREATE_RECORD) {
    getCredentials().then(async (credentials) => {
      if (!credentials) {
        return response({ message: 'Credentials not set!', type: ErrorTypes.undefinedCredentials });
      }

      if (!msg.payload.profile) return response(null);

      const data = await createContact(msg.payload.profile);

      if (data) {
        response({ status: ContactQueryStatus.created });
      }

      response({ status: ContactQueryStatus.error });
    });

    return true;
  }

  if (msg.subject === MessageSubject.DELETE_RECORD) {
    console.log('in here', msg);
    getCredentials().then(async (credentials) => {
      if (!credentials) {
        return response({ message: 'Credentials not set!', type: ErrorTypes.undefinedCredentials });
      }

      if (!msg.payload.id) return response(null);

      const data = await deleteContact(msg.payload.id);

      if (data) {
        response({ status: ContactQueryStatus.deleted });
      }

      response({ status: ContactQueryStatus.error });
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

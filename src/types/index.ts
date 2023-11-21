interface ProfileInfo {
  avatarUrl?: string;
  email?: string;
  displayName: string;
  id: string;
  description: string;
}

interface Credentials {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  code?: string;
}

const ErrorTypes = {
  invalidUrl: 'INVALID_URL',
  undefinedCredentials: 'UNDEFINED_CREDENTIALS',
  fetchError: 'FETCH_ERROR',
  invalidName: 'INVALID_NAME',
} as const;

const ContactQueryStatus = {
  found: 'FOUND',
  notFound: 'NOT_FOUND',
  created: 'CREATED',
  error: 'ERROR',
} as const;

type ContactQueryStatus = (typeof ContactQueryStatus)[keyof typeof ContactQueryStatus];

type ErrorTypes = (typeof ErrorTypes)[keyof typeof ErrorTypes];

type ErrorMessage = {
  type: ErrorTypes;
  message: string;
};

type CRMInfo = { name: string };

type ProfileInfoResponse = ErrorMessage | ProfileInfo;

type CRMInfoResponse = ErrorMessage | CRMInfo;

type CRMQueryStatusResponse = ContactQueryStatus | ErrorMessage;

export type {
  Credentials,
  ProfileInfo,
  ProfileInfoResponse,
  ErrorMessage,
  CRMInfoResponse,
  CRMQueryStatusResponse,
};

export { ErrorTypes, ContactQueryStatus };

export * from './chrome-storage';
export * from './message';

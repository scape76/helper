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
} as const;

type ErrorTypes = (typeof ErrorTypes)[keyof typeof ErrorTypes];

type ErrorMessage = {
  type: ErrorTypes;
  message: string;
};

type CRMInfo = { name: string };

type ProfileInfoResponse = ErrorMessage | ProfileInfo;

type CRMInfoResponse = ErrorMessage | CRMInfo;

type CRMQueryStatusResponse = 'FOUND' | 'NOT_FOUND' | 'CREATED' | ErrorMessage;

export type {
  Credentials,
  ProfileInfo,
  ProfileInfoResponse,
  ErrorMessage,
  CRMInfoResponse,
  CRMQueryStatusResponse,
};

export { ErrorTypes };

export * from './chrome-storage';
export * from './message';

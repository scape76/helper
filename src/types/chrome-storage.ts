interface ProfileInfo {
  displayName: string;
  id: string;
}

interface Credentials {
  clientId?: string;
  clientSecret?: string;
  code?: string;
}

enum StorageKeys {
  PROFILE_INFO = 'profile_info',
  CREDENTIALS = 'credentials',
}

interface ChromeStorage {
  [StorageKeys.PROFILE_INFO]: ProfileInfo;
  [StorageKeys.CREDENTIALS]: Credentials;
}

export type { ChromeStorage, Credentials, ProfileInfo };
export { StorageKeys };

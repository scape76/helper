import { Credentials, ProfileInfo } from '.';

enum StorageKeys {
  PROFILE_INFO = 'profile_info',
  CREDENTIALS = 'credentials',
}

interface ChromeStorageI {
  [StorageKeys.PROFILE_INFO]: ProfileInfo;
  [StorageKeys.CREDENTIALS]: Credentials;
}

export type { ChromeStorageI };
export { StorageKeys };

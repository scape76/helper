import { StorageKeys } from '../types/chrome-storage';
import { ChromeStorageI } from '../types/chrome-storage';

class ChromeStorage {
  public static set(obj: Partial<ChromeStorageI>) {
    chrome.storage.sync.set(obj);
  }
  public static async get<K extends StorageKeys>(key: K): Promise<ChromeStorageI[K] | undefined> {
    return new Promise<ChromeStorageI[K] | undefined>((res, rej) =>
      chrome.storage.sync.get([key], (result) => {
        res(result[key]);
      }),
    );
  }
}

export { ChromeStorage };

import { StorageKeys } from '../types/chrome-storage';
import { ChromeStorage as ChromeStorageI } from '../types/chrome-storage';

class ChromeStorage {
  public static set(obj: Partial<ChromeStorage>) {
    chrome.storage.sync.set(obj);
  }

  public static async get(key: StorageKeys) {
    return new Promise<ChromeStorageI[StorageKeys]>((res, rej) =>
      chrome.storage.sync.get([key], (result) => {
        res(result);
      }),
    );
  }
}

export { ChromeStorage };

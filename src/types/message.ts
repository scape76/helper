enum MessageSubject {
  PROFILE_INFO = 'profile-info',
  CREDENTIALS_SET = 'credentials-set',
  INFO_QUERY = 'info-query',
  FETCH_ERROR = 'fetch-error',
  CREATE_RECORD = 'create-record',
}

enum MessageRecipient {
  CONFIG = 'config',
  PROFILE = 'profile',
}

enum MessageFrom {
  POPUP = 'popup',
  CONFIG = 'config',
  PROFILE = 'profile',
  BACKGROUND = 'background',
}

export { MessageSubject, MessageFrom, MessageRecipient };

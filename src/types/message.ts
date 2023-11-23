enum MessageSubject {
  PROFILE_INFO = 'profile-info',
  CREDENTIALS_SET = 'credentials-set',
  INFO_QUERY = 'info-query',
  FETCH_ERROR = 'fetch-error',
  CREATE_RECORD = 'create-record',
  DELETE_RECORD = 'delete-record',
}

enum MessageRecipient {
  CONFIG = 'config',
  PROFILE = 'profile',
}

enum MessageFrom {
  POPUP = 'popup',
  SCRIPT = 'content-stript',
  CONFIG = 'config',
  PROFILE = 'profile',
  BACKGROUND = 'background',
}

export { MessageSubject, MessageFrom, MessageRecipient };

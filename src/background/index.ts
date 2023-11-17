import { Message } from '../types/message'

console.log('background is running')

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'COUNT') {
    console.log('background has received a message from popup, and count is ', request?.count)
  }

  if (request.type === Message.PROFILE_INFO) {
    console.log('name', request)
  }
})

/* eslint-disable */
// setupJest.js or similar file
global.fetch = require('jest-fetch-mock');
global.Paho = {
  'MQTT': {
    'Client': jest.fn( () => {
      return {
        'connect': jest.fn()
      }
    })
  }
}

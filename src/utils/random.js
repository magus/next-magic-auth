import crypto from 'crypto';

export default {
  base64: function base64(bytes) {
    // generate random bytes
    const randomBytesBuffer = crypto.randomBytes(bytes);
    return randomBytesBuffer.toString('base64');
  },
};

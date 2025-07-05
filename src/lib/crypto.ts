import CryptoJS from 'crypto-js';

const SECRET_KEY = 'llm-comparison-tool-secret-key';

export function encryptApiKey(apiKey: string): string {
  return CryptoJS.AES.encrypt(apiKey, SECRET_KEY).toString();
}

export function decryptApiKey(encryptedKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
// lib/crypto.js

const KEY_STORAGE_NAME = "e2ee_key_pair";

/**
 * Generates and stores an RSA-OAEP key pair in localStorage.
 * @returns {Promise<CryptoKeyPair>} The generated key pair.
 */
export async function generateAndStoreKeyPair() {
  let keyPair = await getKeyPairFromStorage();
  if (keyPair) {
    return keyPair;
  }

  keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  localStorage.setItem(
    KEY_STORAGE_NAME,
    JSON.stringify({ publicKey, privateKey })
  );

  return keyPair;
}

/**
 * Retrieves the key pair from localStorage.
 * @returns {Promise<CryptoKeyPair|null>} The key pair, or null if not found.
 */
async function getKeyPairFromStorage() {
  const storedKeys = localStorage.getItem(KEY_STORAGE_NAME);
  if (!storedKeys) {
    return null;
  }

  const { publicKey, privateKey } = JSON.parse(storedKeys);

  const pub = await window.crypto.subtle.importKey(
    "jwk",
    publicKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );

  const priv = await window.crypto.subtle.importKey(
    "jwk",
    privateKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );

  return { publicKey: pub, privateKey: priv };
}

/**
 * Gets the public key from storage in JWK format.
 * @returns {Promise<JsonWebKey|null>} The public key.
 */
export async function getPublicKey() {
  const keyPair = await getKeyPairFromStorage();
  if (!keyPair) {
    return null;
  }
  return window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
}

export async function encryptMessage(message, key) {
  const encoded = new TextEncoder().encode(message);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return { ciphertext, iv };
}

export async function decryptMessage(ciphertext, key, iv) {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

export async function importPublicKey(jwk) {
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

export async function generateAndExportSymmKey() {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return { key, jwk: await window.crypto.subtle.exportKey("jwk", key) };
}

export async function importSymmKey(jwk) {
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptSymmKey(symmKey, pubKey) {
  const exportedKey = await window.crypto.subtle.exportKey("raw", symmKey);
  return window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pubKey,
    exportedKey
  );
}

export async function decryptSymmKey(encryptedKey) {
  const keyPair = await getKeyPairFromStorage();
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    keyPair.privateKey,
    encryptedKey
  );
  return window.crypto.subtle.importKey(
    "raw",
    decrypted,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

function bufferToBase64(buffer: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export interface EncryptedPayload {
  ciphertext: string
  salt: string
  iv: string
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const pinBuffer = encoder.encode(pin)
  const importedKey = await crypto.subtle.importKey(
    "raw",
    pinBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    importedKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encryptApiKey(apiKey: string, pin: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(pin, salt)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(apiKey)
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encoded
  )

  return {
    ciphertext: bufferToBase64(new Uint8Array(encrypted)),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
  }
}

export async function decryptApiKey(payload: EncryptedPayload, pin: string): Promise<string> {
  const salt = base64ToBuffer(payload.salt)
  const iv = base64ToBuffer(payload.iv)
  const ciphertext = base64ToBuffer(payload.ciphertext)
  const key = await deriveKey(pin, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  )
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

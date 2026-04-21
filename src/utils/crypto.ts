import { useState, useEffect } from 'react';
<<<<<<< HEAD
import CryptoJS from 'crypto-js';

// --- Crypto Utilities ---

export async function encryptData(data: string, password: string): Promise<{ iv: string, data: string }> {
    // Generate a random 128-bit IV (16 bytes)
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(data, password, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    return {
        iv: iv.toString(CryptoJS.enc.Base64),
        data: encrypted.toString() // This is already base64 encoded by crypto-js
=======

// --- Crypto Utilities ---

async function getKey(password: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("synapse-salt"), // In prod, use random salt per room
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(data: string, password: string): Promise<{ iv: string, data: string }> {
    const key = await getKey(password);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);
    
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedData
    );

    // Convert to Base64 for transport
    const ivStr = btoa(String.fromCharCode(...new Uint8Array(iv)));
    const dataStr = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    
    return {
        iv: ivStr,
        data: dataStr
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
    };
}

export async function decryptData(encryptedData: string, ivStr: string, password: string): Promise<string> {
    try {
<<<<<<< HEAD
        const iv = CryptoJS.enc.Base64.parse(ivStr);
        
        const decrypted = CryptoJS.AES.decrypt(encryptedData, password, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (!result) throw new Error("Empty decryption result");
        return result;
=======
        const key = await getKey(password);
        const iv = new Uint8Array(atob(ivStr).split('').map(c => c.charCodeAt(0)));
        const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );
        return new TextDecoder().decode(decrypted);
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
    } catch (e) {
        console.error("Decryption failed:", e);
        return "[Encrypted Data - Decryption Failed]";
    }
}

<<<<<<< HEAD
function arrayBufferToWordArray(ab: ArrayBuffer) {
    const i8a = new Uint8Array(ab);
    const a = [];
    for (let i = 0; i < i8a.length; i += 4) {
        a.push((i8a[i] << 24) | (i8a[i + 1] << 16) | (i8a[i + 2] << 8) | (i8a[i + 3]));
    }
    return CryptoJS.lib.WordArray.create(a, i8a.length);
}

function wordArrayToArrayBuffer(wordArray: CryptoJS.lib.WordArray) {
    const l = wordArray.sigBytes;
    const words = wordArray.words;
    const result = new Uint8Array(l);
    let i = 0, j = 0;
    while (true) {
        if (i == l) break;
        const w = words[j++];
        result[i++] = (w & 0xff000000) >>> 24;
        if (i == l) break;
        result[i++] = (w & 0x00ff0000) >>> 16;
        if (i == l) break;
        result[i++] = (w & 0x0000ff00) >>> 8;
        if (i == l) break;
        result[i++] = (w & 0x000000ff);
    }
    return result.buffer;
}

export async function encryptFile(fileBuffer: ArrayBuffer, password: string): Promise<ArrayBuffer> {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    
    const keyMaterial = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: new Uint8Array(16), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-CBC", length: 256 }, false, ["encrypt"]
    );
    
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv }, key, fileBuffer);
    
    const result = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(cipherBuffer), iv.byteLength);
=======
export async function encryptFile(fileBuffer: ArrayBuffer, password: string): Promise<ArrayBuffer> {
    const key = await getKey(password);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        fileBuffer
    );

    // Combine IV and Encrypted Data
    const result = new Uint8Array(iv.byteLength + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.byteLength);
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
    
    return result.buffer;
}

export async function decryptFile(encryptedBuffer: ArrayBuffer, password: string): Promise<ArrayBuffer> {
<<<<<<< HEAD
    const ivBuffer = encryptedBuffer.slice(0, 16);
    const cipherBuffer = encryptedBuffer.slice(16);

    const keyMaterial = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: new Uint8Array(16), iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-CBC", length: 256 }, false, ["decrypt"]
    );
    return crypto.subtle.decrypt({ name: "AES-CBC", iv: ivBuffer }, key, cipherBuffer);
=======
    try {
        const key = await getKey(password);
        
        const iv = encryptedBuffer.slice(0, 12);
        const data = encryptedBuffer.slice(12);
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            key,
            data
        );
        
        return decrypted;
    } catch (e) {
        console.error("File decryption failed:", e);
        throw new Error("Decryption failed");
    }
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
}

// --- Hook for easy usage ---
export const useEncryption = (roomPassword: string) => {
    const encrypt = async (text: string) => {
        if (!roomPassword) return { iv: '', data: text }; // Fallback
        return await encryptData(text, roomPassword);
    };

    const decrypt = async (encryptedData: string, iv: string) => {
        if (!roomPassword || !iv) return encryptedData; // Fallback
        return await decryptData(encryptedData, iv, roomPassword);
    };

    return { encrypt, decrypt };
};

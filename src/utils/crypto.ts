import { useState, useEffect } from 'react';

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
    };
}

export async function decryptData(encryptedData: string, ivStr: string, password: string): Promise<string> {
    try {
        const key = await getKey(password);
        const iv = new Uint8Array(atob(ivStr).split('').map(c => c.charCodeAt(0)));
        const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed:", e);
        return "[Encrypted Data - Decryption Failed]";
    }
}

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
    
    return result.buffer;
}

export async function decryptFile(encryptedBuffer: ArrayBuffer, password: string): Promise<ArrayBuffer> {
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

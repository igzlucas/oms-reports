
'use client';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '.';

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 * This function is designed to work on the client-side.
 *
 * @param file The file object to upload.
 * @param path The path in Firebase Storage where the file should be saved.
 * @returns A promise that resolves with the public URL of the uploaded file.
 */
export async function uploadFileAndGetURL(file: File, path: string): Promise<string> {
    // initializeFirebase() correctly gets the singleton app instance.
    const { storage } = initializeFirebase();

    // Create a storage reference from the provided path.
    const storageRef = ref(storage, path);
    
    // Upload the file to the specified path.
    const snapshot = await uploadBytes(storageRef, file);

    // Get the public download URL for the file.
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

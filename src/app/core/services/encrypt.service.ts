import { Injectable } from '@angular/core';
import * as forge from 'node-forge';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EncryptService {

    private aesKey: string;
    private aesHmac: string;

    constructor() {
      // Cargar clave AES y Hash desde environment
      const aesKeyBase64 = environment.encript.simmetric?.trim();
      const aesHmacUtf8 = environment.encript.hash?.trim();
  
      if (!aesKeyBase64 || !aesHmacUtf8) {
        throw new Error('Las claves AES o HMAC no están configuradas en environment.');
      }
  
      this.aesKey = forge.util.decode64(aesKeyBase64); // Decodificar clave AES
      this.aesHmac = aesHmacUtf8; // Mantener el hash en UTF-8
    }



  // Método para cifrar texto
  cifrarRsa(plainText: string): string {
    try {
      if (!environment.encript.publickey) {
        throw new Error('La clave pública no está configurada en environment.');
      }

      const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${environment.encript.publickey}\n-----END PUBLIC KEY-----`;
      const publicKeyObj = forge.pki.publicKeyFromPem(publicKeyPEM);
      const encrypted = publicKeyObj.encrypt(plainText, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: forge.md.sha256.create()
      });

      return forge.util.encode64(encrypted);
    } catch (error) {
      // Asegurarse de que 'error' tiene un mensaje
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error al cifrar: ${errorMessage}`);
      throw new Error('Error al cifrar el texto: ' +  errorMessage);
    }
  }

  // Método para descifrar texto
  descifrarRsa(cipherText: string): string {
    try {
      if (!environment.encript.privatekey) {
        throw new Error('La clave privada no está configurada en environment.');
      }

      const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${environment.encript.privatekey}\n-----END PRIVATE KEY-----`;
      const privateKeyObj = forge.pki.privateKeyFromPem(privateKeyPEM);
      const decrypted = privateKeyObj.decrypt(
        forge.util.decode64(cipherText),
        'RSA-OAEP',
        {
          md: forge.md.sha256.create(),
          mgf1: forge.md.sha256.create()
        }
      );

      return decrypted;
    } catch (error) {
      // Asegurarse de que 'error' tiene un mensaje
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error al descifrar: ${errorMessage}`);
      throw new Error('Error al cifrar el texto: ' +  errorMessage);
    }
  }


    /**
   * Cifra un texto con AES-GCM y `associatedData` usando node-forge.
   * @param texto Texto en claro a cifrar.
   * @returns Texto cifrado en Base64.
   */
    cifrarAes(texto: string): string {
      try {
        const iv = forge.random.getBytesSync(12); // IV de 12 bytes
        const cipher = forge.cipher.createCipher('AES-GCM', this.aesKey);
    
        cipher.start({
          iv: iv,
          additionalData: this.aesHmac, // Pasar como string en lugar de Buffer
          tagLength: 128, // 128 bits, igual que en Java
        });
    
        cipher.update(forge.util.createBuffer(texto, 'utf8'));
        cipher.finish();
    
        const encrypted = cipher.output.getBytes(); // Datos cifrados
        const tag = cipher.mode.tag.getBytes(); // Etiqueta de autenticación (16 bytes)
    
        // Concatenar IV (12 bytes) + Cifrado + Tag (16 bytes)
        const finalBuffer = iv + encrypted + tag;
    
        return forge.util.encode64(finalBuffer); // Codificar en Base64
      } catch (error) {
        console.error('Error al cifrar:', error);
        throw new Error('Error al cifrar el texto: ' + (error instanceof Error ? error.message : String(error)));
      }
    }

  descifrarAes(textoCifrado: string): string {
    try {
      const plainText = textoCifrado.replace(/['"]+/g, '');
      const decoded = forge.util.decode64(plainText);
  
      const iv = decoded.slice(0, 12); // Extraer IV (12 bytes)
      const encrypted = decoded.slice(12, -16); // Extraer datos cifrados
      const tag = decoded.slice(-16); // Extraer etiqueta de autenticación
  
      const decipher = forge.cipher.createDecipher('AES-GCM', this.aesKey);
      decipher.start({
        iv: forge.util.createBuffer(iv), // Convertir IV a Buffer
        additionalData: this.aesHmac, // Pasar AAD como string en lugar de Buffer
        tagLength: 128, // Debe coincidir con Java (128 bits)
        tag: forge.util.createBuffer(tag), // Convertir Tag a Buffer
      });
  
      decipher.update(forge.util.createBuffer(encrypted));
      const success = decipher.finish();
  
      if (!success) {
        throw new Error('Error en la autenticación del descifrado.');
      }
      return decipher.output.toString();
    } catch (error) {
      console.error('Error al descifrar:', error);
      throw new Error('Error al descifrar el texto: ' + (error instanceof Error ? error.message : String(error)));
    }
  }





}

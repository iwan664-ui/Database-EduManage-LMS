/**
 * Biometric Authentication Service using Web Authentication API (WebAuthn)
 * Supports Fingerprint, Touch ID, Face ID, and Windows Hello platform authenticators.
 */

import { SecurityService } from './securityService';

export interface BiometricCredential {
  credentialId: string;
  userName: string;
  role: string;
  enrolledAt: string;
  authenticatorType: string;
}

const STORAGE_KEY_BIOMETRICS = 'edumanage_biometric_credentials';
const RP_NAME = 'AL-WILDAN 29 KOTA DEPOK LMS';

// Helper buffer conversion
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export class BiometricService {
  /**
   * Cek ketersediaan Web Authentication API dan sensor biometrik perangkat
   */
  static async isAvailable(): Promise<{ supported: boolean; platformAuthenticator: boolean; reason?: string }> {
    if (typeof window === 'undefined') {
      return { supported: false, platformAuthenticator: false, reason: 'Lingkungan non-browser' };
    }

    if (!window.PublicKeyCredential) {
      return {
        supported: false,
        platformAuthenticator: false,
        reason: 'Browser Anda tidak mendukung Web Authentication API (WebAuthn)',
      };
    }

    try {
      const hasPlatform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return {
        supported: true,
        platformAuthenticator: hasPlatform,
      };
    } catch {
      return {
        supported: true,
        platformAuthenticator: false,
      };
    }
  }

  /**
   * Mengambil kredensial biometrik yang tersimpan
   */
  static getStoredCredentials(): BiometricCredential[] {
    const raw = localStorage.getItem(STORAGE_KEY_BIOMETRICS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Cek apakah user tertentu telah mendaftarkan biometrik
   */
  static isUserEnrolled(userName: string, role: string): boolean {
    const creds = this.getStoredCredentials();
    return creds.some(
      (c) => c.userName.toLowerCase() === userName.toLowerCase() && c.role.toLowerCase() === role.toLowerCase()
    );
  }

  /**
   * Daftarkan kredensial biometrik baru (Sidik Jari / Face ID) menggunakan navigator.credentials.create
   */
  static async registerBiometric(user: { id?: string; name: string; role: string }): Promise<{
    success: boolean;
    message: string;
    credential?: BiometricCredential;
  }> {
    const avail = await this.isAvailable();
    if (!avail.supported) {
      return { success: false, message: avail.reason || 'Perangkat tidak mendukung WebAuthn' };
    }

    try {
      // Generate random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // User ID buffer
      const userIdStr = user.id || user.name;
      const userIdBuffer = new TextEncoder().encode(userIdStr);

      const rpId = window.location.hostname || 'localhost';

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge.buffer,
        rp: {
          name: RP_NAME,
          id: rpId,
        },
        user: {
          id: userIdBuffer.buffer,
          name: user.name,
          displayName: user.name,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Touch ID / Face ID / Windows Hello / Android Biometrics
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Pendaftaran biometrik dibatalkan.');
      }

      const credIdBase64 = bufferToBase64Url(credential.rawId);

      const newBiometric: BiometricCredential = {
        credentialId: credIdBase64,
        userName: user.name,
        role: user.role,
        enrolledAt: new Date().toISOString(),
        authenticatorType: 'Biometrik Platform (Sidik Jari / Wajah)',
      };

      // Simpan kredensial
      const existing = this.getStoredCredentials().filter(
        (c) => !(c.userName.toLowerCase() === user.name.toLowerCase() && c.role.toLowerCase() === user.role.toLowerCase())
      );
      localStorage.setItem(STORAGE_KEY_BIOMETRICS, JSON.stringify([...existing, newBiometric]));

      SecurityService.logSecurityEvent({
        eventType: 'BIOMETRIC_REGISTERED',
        userName: user.name,
        role: user.role,
        details: 'Kredensial biometrik (WebAuthn) berhasil didaftarkan pada perangkat ini.',
      });

      return {
        success: true,
        message: 'Autentikasi biometrik berhasil diaktifkan untuk akun Anda!',
        credential: newBiometric,
      };
    } catch (err: any) {
      console.warn('Gagal pendaftaran biometrik:', err);
      let errorMsg = 'Pendaftaran biometrik gagal atau dibatalkan.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Akses biometrik dibatalkan oleh pengguna atau waktu habis.';
      } else if (err.name === 'NotSupportedError') {
        errorMsg = 'Sensor biometrik platform tidak tersedia di perangkat ini.';
      }
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Autentikasi dengan biometrik menggunakan navigator.credentials.get
   */
  static async authenticateBiometric(targetUser?: { name: string; role: string }): Promise<{
    success: boolean;
    message: string;
    user?: { name: string; role: string };
  }> {
    const creds = this.getStoredCredentials();
    if (creds.length === 0) {
      return {
        success: false,
        message: 'Belum ada kredensial biometrik yang didaftarkan pada perangkat ini. Silakan aktifkan di Pengaturan Keamanan.',
      };
    }

    // Filter kredensial untuk user target jika dispesifikasi
    let relevantCreds = creds;
    if (targetUser) {
      relevantCreds = creds.filter(
        (c) => c.userName.toLowerCase() === targetUser.name.toLowerCase() && c.role.toLowerCase() === targetUser.role.toLowerCase()
      );
      if (relevantCreds.length === 0) {
        return {
          success: false,
          message: `Biometrik belum diaktifkan untuk ${targetUser.name}. Silakan masuk dengan kata sandi terlebih dahulu.`,
        };
      }
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const rpId = window.location.hostname || 'localhost';

      const allowCredentials: PublicKeyCredentialDescriptor[] = relevantCreds.map((c) => ({
        id: base64UrlToBuffer(c.credentialId),
        type: 'public-key',
        transports: ['internal'],
      }));

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: challenge.buffer,
          rpId,
          userVerification: 'required',
          timeout: 60000,
          allowCredentials,
        },
      })) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('Verifikasi biometrik tidak berhasil.');
      }

      const returnedId = bufferToBase64Url(assertion.rawId);
      const matched = relevantCreds.find((c) => c.credentialId === returnedId) || relevantCreds[0];

      SecurityService.logSecurityEvent({
        eventType: 'BIOMETRIC_AUTH_SUCCESS',
        userName: matched.userName,
        role: matched.role,
        details: 'Login cepat biometrik (Sidik Jari / Face ID) diverifikasi sukses.',
      });

      return {
        success: true,
        message: `Verifikasi biometrik berhasil. Selamat datang, ${matched.userName}!`,
        user: { name: matched.userName, role: matched.role },
      };
    } catch (err: any) {
      console.warn('Biometric auth error:', err);
      let errorMsg = 'Verifikasi biometrik gagal.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Verifikasi biometrik dibatalkan.';
      }

      SecurityService.logSecurityEvent({
        eventType: 'BIOMETRIC_AUTH_FAILED',
        userName: targetUser?.name || 'Unknown',
        role: targetUser?.role || 'tutor',
        details: `Verifikasi biometrik ditolak: ${err.message || err.name}`,
      });

      return { success: false, message: errorMsg };
    }
  }

  /**
   * Hapus pendaftaran biometrik untuk user
   */
  static removeBiometric(userName: string, role: string): boolean {
    const creds = this.getStoredCredentials();
    const filtered = creds.filter(
      (c) => !(c.userName.toLowerCase() === userName.toLowerCase() && c.role.toLowerCase() === role.toLowerCase())
    );
    localStorage.setItem(STORAGE_KEY_BIOMETRICS, JSON.stringify(filtered));

    SecurityService.logSecurityEvent({
      eventType: 'BIOMETRIC_DELETED',
      userName,
      role,
      details: 'Kredensial biometrik dihapus dari perangkat.',
    });

    return true;
  }
}

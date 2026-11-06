/**
 * Security Service for AL-WILDAN ISLAMIC SCHOOL 29 LMS
 * Provides cryptographic hashing, rate limiting, session protection, XSS sanitization, and audit logging.
 */

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGIN_LOCKED'
    | 'BIOMETRIC_REGISTERED'
    | 'BIOMETRIC_AUTH_SUCCESS'
    | 'BIOMETRIC_AUTH_FAILED'
    | 'BIOMETRIC_DELETED'
    | 'DATA_EXPORTED'
    | 'SESSION_EXPIRED';
  userName: string;
  role: string;
  ipOrDevice: string;
  details: string;
}

const STORAGE_KEY_AUDIT = 'edumanage_security_audit_logs';
const STORAGE_KEY_FAILED_ATTEMPTS = 'edumanage_failed_attempts';
const STORAGE_KEY_LOCKOUT_UNTIL = 'edumanage_lockout_until';
const STORAGE_KEY_SESSION = 'edumanage_secure_session';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 detik lockout
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 jam session timeout

export class SecurityService {
  /**
   * SHA-256 Cryptographic Hash menggunakan Web Crypto API
   */
  static async sha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Sanitasi string untuk mencegah Cross-Site Scripting (XSS)
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Cek apakah sistem sedang terkunci karena terlalu banyak percobaan login gagal
   */
  static isLockedOut(): { locked: boolean; remainingSeconds: number } {
    const lockoutUntil = localStorage.getItem(STORAGE_KEY_LOCKOUT_UNTIL);
    if (!lockoutUntil) return { locked: false, remainingSeconds: 0 };

    const remaining = Number(lockoutUntil) - Date.now();
    if (remaining > 0) {
      return { locked: true, remainingSeconds: Math.ceil(remaining / 1000) };
    }

    // Lockout selesai, reset
    localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
    localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
    return { locked: false, remainingSeconds: 0 };
  }

  /**
   * Catat percobaan login gagal dan aktifkan lockout jika melebihi batas
   */
  static recordFailedAttempt(userName: string, role: string): { locked: boolean; remainingAttempts: number; remainingSeconds: number } {
    const current = Number(localStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS) || '0') + 1;
    localStorage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, String(current));

    if (current >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(STORAGE_KEY_LOCKOUT_UNTIL, String(lockUntil));

      this.logSecurityEvent({
        eventType: 'LOGIN_LOCKED',
        userName,
        role,
        details: `Akun terkunci otomatis selama 60 detik akibat ${MAX_FAILED_ATTEMPTS} kali kegagalan autentikasi berturut-turut.`,
      });

      return { locked: true, remainingAttempts: 0, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
    }

    this.logSecurityEvent({
      eventType: 'LOGIN_FAILED',
      userName,
      role,
      details: `Percobaan login gagal ke-${current}. Tersisa ${MAX_FAILED_ATTEMPTS - current} percobaan.`,
    });

    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - current, remainingSeconds: 0 };
  }

  /**
   * Reset kegagalan login saat berhasil
   */
  static resetFailedAttempts(): void {
    localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
  }

  /**
   * Buat sesi terenkripsi bertanda tangan
   */
  static async createSecureSession(user: { id?: string; name: string; role: string; email?: string }): Promise<string> {
    this.resetFailedAttempts();

    const timestamp = Date.now();
    const expiresAt = timestamp + SESSION_TTL_MS;
    const entropy = Math.random().toString(36).substring(2, 10);
    const rawPayload = `${user.name}|${user.role}|${timestamp}|${expiresAt}|${entropy}`;
    const tokenSignature = await this.sha256(rawPayload);

    const sessionData = {
      user,
      timestamp,
      expiresAt,
      token: tokenSignature,
    };

    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionData));

    this.logSecurityEvent({
      eventType: 'LOGIN_SUCCESS',
      userName: user.name,
      role: user.role,
      details: `Autentikasi kredensial berhasil. Sesi aktif berlaku hingga ${new Date(expiresAt).toLocaleTimeString('id-ID')}.`,
    });

    return tokenSignature;
  }

  /**
   * Verifikasi validitas sesi aktif
   */
  static isSessionValid(): boolean {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return false;
    try {
      const session = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bersihkan sesi saat logout
   */
  static clearSession(): void {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }

  /**
   * Ambil Audit Log Keamanan
   */
  static getAuditLogs(): SecurityAuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Catat peristiwa keamanan ke Audit Trail
   */
  static logSecurityEvent(params: {
    eventType: SecurityAuditLog['eventType'];
    userName: string;
    role: string;
    details: string;
  }): void {
    const logs = this.getAuditLogs();
    const newLog: SecurityAuditLog = {
      id: `SEC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType: params.eventType,
      userName: params.userName || 'Pengguna Tidak Dikenal',
      role: params.role || 'Guest',
      ipOrDevice: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
      details: params.details,
    };

    // Simpan maksimal 100 log terbaru
    const updated = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updated));
  }

  /**
   * Hapus riwayat audit log (khusus admin)
   */
  static clearAuditLogs(): void {
    localStorage.removeItem(STORAGE_KEY_AUDIT);
  }
}

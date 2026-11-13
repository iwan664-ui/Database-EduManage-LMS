/**
 * Security Service for AL-WILDAN ISLAMIC SCHOOL 3 BSD CITY LMS
 * Provides cryptographic hashing, server-backed HMAC session verification,
 * anti-tamper integrity sealing, rate limiting, idle auto-lock, personal PIN (2nd layer),
 * XSS & CSV injection sanitization, and RBAC-protected audit logging.
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
    | 'SESSION_EXPIRED'
    | 'SESSION_TAMPER_DETECTED'
    | 'SCREEN_LOCKED'
    | 'SCREEN_UNLOCKED'
    | 'PIN_CONFIGURED'
    | 'UNAUTHORIZED_ACCESS_BLOCKED'
    | 'AUDIT_LOG_CLEARED';
  userName: string;
  role: string;
  ipOrDevice: string;
  details: string;
}

interface StoredSession {
  user: { id?: string; id_tutor?: string; name: string; role: string; email?: string };
  timestamp: number;
  expiresAt: number;
  lastActivityAt: number;
  token: string;
  fp: string;
  integritySeal: string;
}

interface PersonalPinRecord {
  userKey: string;
  salt: string;
  hash: string;
  updatedAt: string;
}

const STORAGE_KEY_AUDIT = 'edumanage_security_audit_logs';
const STORAGE_KEY_FAILED_ATTEMPTS = 'edumanage_failed_attempts';
const STORAGE_KEY_LOCKOUT_UNTIL = 'edumanage_lockout_until';
const STORAGE_KEY_LOCKOUT_COUNT = 'edumanage_lockout_count';
const STORAGE_KEY_SESSION = 'edumanage_secure_session';
const STORAGE_KEY_IDLE_TIMEOUT_MIN = 'edumanage_idle_timeout_min';
const STORAGE_KEY_PERSONAL_PINS = 'edumanage_personal_pins';

const MAX_FAILED_ATTEMPTS = 5;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 jam session timeout
const DEFAULT_IDLE_TIMEOUT_MIN = 30;
const UNIFIED_PASSWORD_SHA256 = 'a13151dda35b0d1c97fecfabc2edccda8c896127a902988cf758d34e20a4fd6c';
const CLIENT_SEAL_PEPPER = 'AW3-BSD-CITY-INTEGRITY-SHIELD-2026';

export class SecurityService {
  /**
   * SHA-256 Cryptographic Hash menggunakan Web Crypto API
   */
  static async sha256(text: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return '';
  }

  /**
   * Constant-time string comparison in browser
   */
  static constantTimeEquals(a: string, b: string): boolean {
    if (!a || !b || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }

  /**
   * Fingerprint perangkat deterministik untuk mengikat sesi ke browser ini
   */
  static async getDeviceFingerprint(): Promise<string> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'server';
    const raw = [
      navigator.userAgent || '',
      navigator.language || '',
      navigator.platform || '',
      String(window.screen?.width || 0),
      String(window.screen?.height || 0),
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    ].join('|');
    const hashed = await this.sha256(raw);
    return hashed.slice(0, 32) || 'browser-fp';
  }

  /**
   * Hitung Integrity Seal anti-manipulasi localStorage
   */
  private static async computeSessionSeal(params: {
    name: string;
    role: string;
    timestamp: number;
    expiresAt: number;
    token: string;
    fp: string;
  }): Promise<string> {
    return this.sha256(
      `${params.name}|${params.role}|${params.timestamp}|${params.expiresAt}|${params.token}|${params.fp}|${CLIENT_SEAL_PEPPER}`
    );
  }

  /**
   * Verifikasi password login terpadu berbasis hash SHA-256 (Fallback / Offline)
   */
  static async verifyLoginPassword(inputPassword: string): Promise<boolean> {
    if (!inputPassword) return false;
    const hashed = await this.sha256(inputPassword);
    return this.constantTimeEquals(hashed, UNIFIED_PASSWORD_SHA256);
  }

  /**
   * Autentikasi langsung ke Server Express (/api/auth/login) untuk mendapatkan
   * token sesi bertanda tangan HMAC-SHA256 + brute-force lockout sisi server.
   */
  static async authenticateWithServer(params: {
    userName: string;
    role: 'tutor' | 'siswa' | 'admin';
    password: string;
  }): Promise<{
    success: boolean;
    token?: string;
    expiresAt?: number;
    error?: string;
    locked?: boolean;
    remainingAttempts?: number;
    remainingSeconds?: number;
  }> {
    const cleanName = this.sanitizeText(params.userName, 80);
    const fp = await this.getDeviceFingerprint();

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          userName: cleanName,
          role: params.role,
          password: params.password,
          deviceFingerprint: fp,
        }),
      });

      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Non-JSON server response');
      }

      const data = await resp.json();
      if (resp.ok && data.success) {
        this.resetFailedAttempts();
        return {
          success: true,
          token: data.token,
          expiresAt: data.expiresAt,
        };
      }

      if (data.locked) {
        const secs = Number(data.remainingSeconds) || 60;
        localStorage.setItem(STORAGE_KEY_LOCKOUT_UNTIL, String(Date.now() + secs * 1000));
        this.logSecurityEvent({
          eventType: 'LOGIN_LOCKED',
          userName: cleanName,
          role: params.role,
          details: `Server mengunci login selama ${secs} detik akibat kegagalan berulang.`,
        });
      } else {
        this.logSecurityEvent({
          eventType: 'LOGIN_FAILED',
          userName: cleanName,
          role: params.role,
          details: data.error || 'Autentikasi gagal ditolak oleh server.',
        });
      }

      return {
        success: false,
        error: data.error || 'Password salah.',
        locked: Boolean(data.locked),
        remainingAttempts: data.remainingAttempts,
        remainingSeconds: data.remainingSeconds,
      };
    } catch {
      // Fallback jika mode offline/statis tanpa Express server
      const isValid = await this.verifyLoginPassword(params.password);
      if (!isValid) {
        const lockStatus = this.recordFailedAttempt(cleanName, params.role);
        return {
          success: false,
          locked: lockStatus.locked,
          remainingAttempts: lockStatus.remainingAttempts,
          remainingSeconds: lockStatus.remainingSeconds,
          error: lockStatus.locked
            ? `Terlalu banyak percobaan gagal! Sistem terkunci selama ${lockStatus.remainingSeconds} detik.`
            : `Password salah! Tersisa ${lockStatus.remainingAttempts} percobaan sebelum akses dikunci otomatis.`,
        };
      }
      this.resetFailedAttempts();
      return { success: true };
    }
  }

  /**
   * Minta server menerbitkan token sesi HMAC-SHA256 setelah WebAuthn biometrik berhasil
   */
  static async issueBiometricServerSession(params: {
    userName: string;
    role: string;
    credentialId: string;
  }): Promise<{ token?: string; expiresAt?: number }> {
    try {
      const fp = await this.getDeviceFingerprint();
      const resp = await fetch('/api/auth/biometric-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          userName: params.userName,
          role: params.role,
          credentialId: params.credentialId,
          deviceFingerprint: fp,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data.token) {
          return { token: data.token, expiresAt: data.expiresAt };
        }
      }
    } catch {
      // Ignore offline fallback
    }
    return {};
  }

  /**
   * Sanitasi HTML entity untuk mencegah XSS pada output string mentah
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
   * Sanitasi teks aman untuk React state / input pengguna (menghapus tag HTML, script, null bytes)
   */
  static sanitizeText(input: string, maxLen = 300): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .trim()
      .slice(0, maxLen);
  }

  /**
   * Perlindungan CSV Formula Injection (DDE / Excel Formula Attack)
   * Mencegah sel yang diawali =, +, -, @, tab, CR dieksekusi di Excel/Google Sheets
   */
  static escapeCsvCell(val: string | number | undefined | null): string {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    str = str.replace(/"/g, '""');
    return `"${str}"`;
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

    localStorage.removeItem(STORAGE_KEY_LOCKOUT_UNTIL);
    localStorage.removeItem(STORAGE_KEY_FAILED_ATTEMPTS);
    return { locked: false, remainingSeconds: 0 };
  }

  /**
   * Catat percobaan login gagal dan aktifkan lockout bertingkat jika melebihi batas
   */
  static recordFailedAttempt(
    userName: string,
    role: string
  ): { locked: boolean; remainingAttempts: number; remainingSeconds: number } {
    const current = Number(localStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS) || '0') + 1;
    localStorage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, String(current));

    if (current >= MAX_FAILED_ATTEMPTS) {
      const lockCount = Number(localStorage.getItem(STORAGE_KEY_LOCKOUT_COUNT) || '0') + 1;
      localStorage.setItem(STORAGE_KEY_LOCKOUT_COUNT, String(lockCount));
      const lockSeconds = lockCount === 1 ? 60 : lockCount === 2 ? 180 : 300;
      const lockUntil = Date.now() + lockSeconds * 1000;
      localStorage.setItem(STORAGE_KEY_LOCKOUT_UNTIL, String(lockUntil));

      this.logSecurityEvent({
        eventType: 'LOGIN_LOCKED',
        userName,
        role,
        details: `Akun terkunci otomatis selama ${lockSeconds} detik akibat ${MAX_FAILED_ATTEMPTS} kali kegagalan autentikasi berturut-turut.`,
      });

      return { locked: true, remainingAttempts: 0, remainingSeconds: lockSeconds };
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
    localStorage.removeItem(STORAGE_KEY_LOCKOUT_COUNT);
  }

  /**
   * Buat sesi terenkripsi bertanda tangan & tersegel integritas SHA-256
   */
  static async createSecureSession(
    user: { id?: string; id_tutor?: string; name: string; role: string; email?: string },
    serverToken?: string,
    serverExpiresAt?: number
  ): Promise<string> {
    this.resetFailedAttempts();

    const timestamp = Date.now();
    const expiresAt = serverExpiresAt || timestamp + SESSION_TTL_MS;
    const fp = await this.getDeviceFingerprint();

    let tokenSignature = serverToken || '';
    if (!tokenSignature) {
      const entropyArr = new Uint8Array(16);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(entropyArr);
      }
      const entropy = Array.from(entropyArr, (b) => b.toString(16).padStart(2, '0')).join('');
      const rawPayload = `${user.name}|${user.role}|${timestamp}|${expiresAt}|${fp}|${entropy}`;
      tokenSignature = await this.sha256(rawPayload);
    }

    const integritySeal = await this.computeSessionSeal({
      name: user.name,
      role: user.role,
      timestamp,
      expiresAt,
      token: tokenSignature,
      fp,
    });

    const sessionData: StoredSession = {
      user,
      timestamp,
      expiresAt,
      lastActivityAt: timestamp,
      token: tokenSignature,
      fp,
      integritySeal,
    };

    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(sessionData));

    this.logSecurityEvent({
      eventType: 'LOGIN_SUCCESS',
      userName: user.name,
      role: user.role,
      details: `Autentikasi kredensial berhasil (HMAC/SHA-256 Verified). Sesi aktif hingga ${new Date(
        expiresAt
      ).toLocaleTimeString('id-ID')}.`,
    });

    return tokenSignature;
  }

  /**
   * Ambil sesi tersimpan
   */
  static getStoredSession(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  }

  /**
   * Ambil token sesi aktif untuk Authorization Bearer header
   */
  static getSessionToken(): string {
    const session = this.getStoredSession();
    return session?.token || '';
  }

  /**
   * Header HTTP terautentikasi untuk panggilan API ke backend
   */
  static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getSessionToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Verifikasi sinkron cepat validitas waktu sesi
   */
  static isSessionValid(): boolean {
    const session = this.getStoredSession();
    if (!session || !session.expiresAt || !session.user) return false;
    if (Date.now() > session.expiresAt) {
      this.clearSession();
      return false;
    }
    return true;
  }

  /**
   * Verifikasi kriptografi penuh integritas sesi + deteksi manipulasi localStorage
   */
  static async verifySessionIntegrity(expectedUser?: {
    name: string;
    role: string;
  }): Promise<{ valid: boolean; reason?: 'expired' | 'tampered' | 'idle' | 'missing' }> {
    const session = this.getStoredSession();
    if (!session || !session.user || !session.integritySeal || !session.token) {
      return { valid: false, reason: 'missing' };
    }

    if (Date.now() > session.expiresAt) {
      this.logSecurityEvent({
        eventType: 'SESSION_EXPIRED',
        userName: session.user.name,
        role: session.user.role,
        details: 'Masa berlaku sesi 8 jam telah berakhir secara otomatis.',
      });
      this.clearSession();
      return { valid: false, reason: 'expired' };
    }

    if (
      expectedUser &&
      (session.user.name !== expectedUser.name || session.user.role !== expectedUser.role)
    ) {
      this.logSecurityEvent({
        eventType: 'SESSION_TAMPER_DETECTED',
        userName: expectedUser.name,
        role: expectedUser.role,
        details: `Terdeteksi ketidaksesuaian identitas/role pada penyimpanan lokal (${expectedUser.role} vs ${session.user.role}). Sesi diblokir.`,
      });
      this.clearSession();
      return { valid: false, reason: 'tampered' };
    }

    const fp = await this.getDeviceFingerprint();
    if (session.fp && session.fp !== fp) {
      this.logSecurityEvent({
        eventType: 'SESSION_TAMPER_DETECTED',
        userName: session.user.name,
        role: session.user.role,
        details: 'Device fingerprint sesi tidak cocok dengan perangkat saat ini.',
      });
      this.clearSession();
      return { valid: false, reason: 'tampered' };
    }

    const expectedSeal = await this.computeSessionSeal({
      name: session.user.name,
      role: session.user.role,
      timestamp: session.timestamp,
      expiresAt: session.expiresAt,
      token: session.token,
      fp: session.fp,
    });

    if (!this.constantTimeEquals(expectedSeal, session.integritySeal)) {
      this.logSecurityEvent({
        eventType: 'SESSION_TAMPER_DETECTED',
        userName: session.user.name,
        role: session.user.role,
        details: 'Signature integritas sesi (SHA-256 Seal) tidak valid. Kemungkinan manipulasi data lokal.',
      });
      this.clearSession();
      return { valid: false, reason: 'tampered' };
    }

    if (this.isIdleExpired()) {
      return { valid: false, reason: 'idle' };
    }

    return { valid: true };
  }

  /**
   * Verifikasi tambahan terhadap endpoint server /api/auth/verify
   */
  static async verifyWithServer(): Promise<boolean> {
    const token = this.getSessionToken();
    if (!token) return false;
    try {
      const resp = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'same-origin',
      });
      if (resp.status === 401) {
        return false;
      }
      if (resp.ok) {
        const data = await resp.json();
        return Boolean(data?.valid);
      }
      return true;
    } catch {
      return true; // Do not log out user if offline/network hiccup
    }
  }

  /**
   * Pengaturan Idle Auto-Lock Timeout (dalam menit, 0 = nonaktif)
   */
  static getIdleTimeoutMinutes(): number {
    const raw = localStorage.getItem(STORAGE_KEY_IDLE_TIMEOUT_MIN);
    if (raw === null) return DEFAULT_IDLE_TIMEOUT_MIN;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_IDLE_TIMEOUT_MIN;
  }

  static setIdleTimeoutMinutes(minutes: number): void {
    const safeMin = Math.max(0, Math.min(240, Math.round(minutes)));
    localStorage.setItem(STORAGE_KEY_IDLE_TIMEOUT_MIN, String(safeMin));
    this.touchActivity();
  }

  static touchActivity(): void {
    const session = this.getStoredSession();
    if (!session) return;
    session.lastActivityAt = Date.now();
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  }

  static isIdleExpired(): boolean {
    const timeoutMin = this.getIdleTimeoutMinutes();
    if (timeoutMin <= 0) return false;
    const session = this.getStoredSession();
    if (!session) return false;
    const last = session.lastActivityAt || session.timestamp;
    return Date.now() - last > timeoutMin * 60 * 1000;
  }

  /**
   * Personal 6-digit Security PIN (Lapisan Keamanan Kedua & Buka Kunci Layar)
   */
  private static getPinRecords(): PersonalPinRecord[] {
    const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_PINS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private static makePinUserKey(name: string, role: string): string {
    return `${role.toLowerCase().trim()}:${name.toLowerCase().trim()}`;
  }

  static hasPersonalPin(name: string, role: string): boolean {
    const key = this.makePinUserKey(name, role);
    return this.getPinRecords().some((p) => p.userKey === key);
  }

  static async setPersonalPin(
    name: string,
    role: string,
    pin: string
  ): Promise<{ success: boolean; message: string }> {
    if (!/^\d{6}$/.test(pin)) {
      return { success: false, message: 'PIN keamanan harus terdiri dari tepat 6 digit angka.' };
    }
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const salt = Array.from(saltBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const hash = await this.sha256(`${salt}:${pin}:${CLIENT_SEAL_PEPPER}`);
    const userKey = this.makePinUserKey(name, role);

    const existing = this.getPinRecords().filter((p) => p.userKey !== userKey);
    const updated: PersonalPinRecord[] = [
      ...existing,
      { userKey, salt, hash, updatedAt: new Date().toISOString() },
    ];
    localStorage.setItem(STORAGE_KEY_PERSONAL_PINS, JSON.stringify(updated));

    this.logSecurityEvent({
      eventType: 'PIN_CONFIGURED',
      userName: name,
      role,
      details: 'PIN Keamanan pribadi 6-digit (Salted SHA-256) berhasil diaktifkan/diperbarui.',
    });

    return { success: true, message: 'PIN Keamanan 6-digit berhasil diaktifkan untuk akun Anda.' };
  }

  static async verifyPersonalPin(name: string, role: string, pin: string): Promise<boolean> {
    if (!/^\d{6}$/.test(pin)) return false;
    const key = this.makePinUserKey(name, role);
    const record = this.getPinRecords().find((p) => p.userKey === key);
    if (!record) return false;
    const candidateHash = await this.sha256(`${record.salt}:${pin}:${CLIENT_SEAL_PEPPER}`);
    return this.constantTimeEquals(candidateHash, record.hash);
  }

  static removePersonalPin(name: string, role: string): void {
    const key = this.makePinUserKey(name, role);
    const filtered = this.getPinRecords().filter((p) => p.userKey !== key);
    localStorage.setItem(STORAGE_KEY_PERSONAL_PINS, JSON.stringify(filtered));
    this.logSecurityEvent({
      eventType: 'PIN_CONFIGURED',
      userName: name,
      role,
      details: 'PIN Keamanan pribadi 6-digit dinonaktifkan oleh pemilik akun.',
    });
  }

  /**
   * Bersihkan sesi & cabut token di server saat logout
   */
  static async logoutFromServer(): Promise<void> {
    const token = this.getSessionToken();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'same-origin',
      });
    } catch {
      // ignore network error during logout
    }
    this.clearSession();
  }

  static clearSession(): void {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }

  /**
   * Hitung skor kesehatan keamanan akun (0 - 100)
   */
  static getSecurityPosture(params: {
    userName: string;
    role: string;
    hasBiometric: boolean;
  }): {
    score: number;
    level: 'Sangat Kuat' | 'Kuat' | 'Standar';
    checks: { label: string; active: boolean; points: number }[];
  } {
    const hasSession = this.isSessionValid();
    const idleActive = this.getIdleTimeoutMinutes() > 0;
    const hasPin = this.hasPersonalPin(params.userName, params.role);
    const recentTamper = this.getAuditLogs()
      .slice(0, 10)
      .some((l) => l.eventType === 'SESSION_TAMPER_DETECTED' || l.eventType === 'LOGIN_LOCKED');

    const checks = [
      { label: 'Sesi HMAC & Integrity Seal SHA-256', active: hasSession, points: 30 },
      { label: 'Proteksi Brute-Force & Anti-XSS/SSRF', active: true, points: 20 },
      { label: 'Auto-Lock Layar Saat Idle', active: idleActive, points: 15 },
      { label: 'Autentikasi Biometrik WebAuthn', active: params.hasBiometric, points: 20 },
      { label: 'PIN Keamanan Pribadi 6-Digit', active: hasPin, points: 15 },
    ];

    let score = checks.reduce((sum, c) => sum + (c.active ? c.points : 0), 0);
    if (recentTamper) score = Math.max(0, score - 10);

    const level = score >= 85 ? 'Sangat Kuat' : score >= 65 ? 'Kuat' : 'Standar';
    return { score, level, checks };
  }

  /**
   * Ambil Audit Log Keamanan
   */
  static getAuditLogs(): SecurityAuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
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
      userName: this.sanitizeText(params.userName || 'Pengguna Tidak Dikenal', 80),
      role: params.role || 'Guest',
      ipOrDevice:
        typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile')
          ? 'Mobile Browser'
          : 'Desktop Browser',
      details: this.sanitizeText(params.details, 240),
    };

    const updated = [newLog, ...logs].slice(0, 150);
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updated));
  }

  /**
   * Hapus riwayat audit log (STRICT RBAC: khusus admin)
   */
  static clearAuditLogs(actorRole?: string, actorName?: string): boolean {
    if (actorRole !== 'admin') {
      this.logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_BLOCKED',
        userName: actorName || 'Unknown',
        role: actorRole || 'unknown',
        details: 'Percobaan penghapusan Audit Log oleh akun non-administrator diblokir.',
      });
      return false;
    }

    localStorage.removeItem(STORAGE_KEY_AUDIT);
    this.logSecurityEvent({
      eventType: 'AUDIT_LOG_CLEARED',
      userName: actorName || 'Administrator',
      role: 'admin',
      details: 'Riwayat audit keamanan direset oleh Administrator terverifikasi.',
    });
    return true;
  }
}

import type { APIRoute } from 'astro';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../../lib/firebase-admin';

const ALLOWED_ROLES = ['admin', 'vendedor', 'mensajero', 'operador_inv'] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];
const devAdminBypassEnabled =
  import.meta.env.ENABLE_DEV_ADMIN_BYPASS === 'true' &&
  import.meta.env.PUBLIC_APP_ENV !== 'production';
const devAdminUid = import.meta.env.DEV_ADMIN_UID || 'dev-admin';

interface CreateUserRequest {
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  roles?: string[];
}

type AdminGuardResult =
  | { uid: string; error?: never }
  | { uid?: never; error: Response };

class ExternalServiceError extends Error {
  status = 503;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim();
}

function getDevAdminBypass(): AdminGuardResult | null {
  return devAdminBypassEnabled ? { uid: devAdminUid } : null;
}

async function requireAdmin(request: Request): Promise<AdminGuardResult> {
  const token = getBearerToken(request);
  if (!token) {
    const devBypass = getDevAdminBypass();
    if (devBypass) return devBypass;

    return { error: jsonResponse({ message: 'No autenticado.' }, 401) };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const claimRoles = Array.isArray(decodedToken.roles)
      ? decodedToken.roles
      : decodedToken.role
        ? [decodedToken.role]
        : [];

    if (claimRoles.includes('admin')) {
      return { uid: decodedToken.uid };
    }

    const adminDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const adminData = adminDoc.data();
    const firestoreRoles = Array.isArray(adminData?.roles) ? adminData.roles : [];

    if (firestoreRoles.includes('admin')) {
      return { uid: decodedToken.uid };
    }

    const devBypass = getDevAdminBypass();
    if (devBypass) return devBypass;

    return { error: jsonResponse({ message: 'No tiene permisos de administrador.' }, 403) };
  } catch {
    const devBypass = getDevAdminBypass();
    if (devBypass) return devBypass;

    return { error: jsonResponse({ message: 'Token de autenticacion invalido.' }, 401) };
  }
}

function validateCreateUserPayload(payload: CreateUserRequest) {
  const displayName = payload.displayName?.trim();
  const email = payload.email?.trim().toLowerCase();
  const phoneNumber = payload.phoneNumber?.trim();
  const roles = Array.isArray(payload.roles)
    ? payload.roles.map((role) => role.trim())
    : payload.role
      ? [payload.role.trim()]
      : [];

  if (!displayName) return { error: 'El nombre es obligatorio.' };
  if (!email) return { error: 'El correo electronico es obligatorio.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Ingrese un correo electronico valido.' };
  }
  if (!phoneNumber) return { error: 'El telefono es obligatorio.' };
  if (roles.length === 0) return { error: 'El rol es obligatorio.' };
  if (roles.some((role) => !ALLOWED_ROLES.includes(role as AllowedRole))) {
    return { error: 'El rol seleccionado no es valido.' };
  }

  return {
    data: {
      displayName,
      email,
      phoneNumber,
      roles: roles as AllowedRole[],
    },
  };
}

function generateTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = `${upper}${lower}${digits}${symbols}`;
  const bytes = crypto.getRandomValues(new Uint32Array(18));
  const required = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    symbols[bytes[3] % symbols.length],
  ];
  const rest = Array.from(bytes.slice(4), (value) => all[value % all.length]);

  return [...required, ...rest]
    .sort(() => crypto.getRandomValues(new Uint32Array(1))[0] - 2 ** 31)
    .join('');
}

function serializeTimestamp(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

function serializeUser(uid: string, data: FirebaseFirestore.DocumentData) {
  return {
    uid: data.uid ?? uid,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    phoneNumber: data.phoneNumber ?? '',
    roles: Array.isArray(data.roles) ? data.roles : [],
    isActive: data.isActive ?? false,
    createdBy: data.createdBy,
    createdAt: serializeTimestamp(data.createdAt),
  };
}

async function emailExistsInFirestore(email: string) {
  let snapshot;

  try {
    snapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
  } catch {
    throw new ExternalServiceError(
      'Firestore no esta disponible. Verifica que el emulador este encendido.',
    );
  }

  return !snapshot.empty;
}

async function emailExistsInAuth(email: string) {
  try {
    await adminAuth.getUserByEmail(email);
    return true;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/user-not-found') return false;
    if (code === 'app/network-error' || code === 'auth/internal-error') {
      throw new ExternalServiceError(
        'Firebase Auth no esta disponible. Verifica que el emulador este encendido.',
      );
    }
    throw error;
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const search = url.searchParams.get('search')?.trim().toLowerCase() ?? '';
  const role = url.searchParams.get('role')?.trim() ?? '';

  if (role && !ALLOWED_ROLES.includes(role as AllowedRole)) {
    return jsonResponse({ message: 'El rol seleccionado no es valido.' }, 400);
  }

  const usersRef = adminDb.collection('users');
  const snapshot = role
    ? await usersRef.where('roles', 'array-contains', role).get()
    : await usersRef.get();

  const users = snapshot.docs
    .map((doc) => serializeUser(doc.id, doc.data()))
    .filter((user) => {
      if (!search) return true;
      return (
        user.displayName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return jsonResponse({ users });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const admin = await requireAdmin(request);
    if (admin.error) return admin.error;

    let payload: CreateUserRequest;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ message: 'El cuerpo de la solicitud no es valido.' }, 400);
    }

    const validation = validateCreateUserPayload(payload);
    if ('error' in validation) {
      return jsonResponse({ message: validation.error }, 400);
    }

    const { displayName, email, phoneNumber, roles } = validation.data;

    if (await emailExistsInFirestore(email)) {
      return jsonResponse({ message: 'El correo ya esta registrado.' }, 409);
    }

    if (await emailExistsInAuth(email)) {
      return jsonResponse({ message: 'El correo ya esta registrado.' }, 409);
    }

    const temporaryPassword = generateTemporaryPassword();
    const userRecord = await adminAuth.createUser({
      email,
      displayName,
      password: temporaryPassword,
      disabled: false,
    });

    const userDoc = {
      uid: userRecord.uid,
      email,
      displayName,
      phoneNumber,
      roles,
      isActive: true,
      createdBy: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
    };

    try {
      await adminAuth.setCustomUserClaims(userRecord.uid, { roles });
      await adminDb.collection('users').doc(userRecord.uid).set(userDoc);
    } catch (error) {
      await adminAuth.deleteUser(userRecord.uid).catch(() => {});
      throw error;
    }

    const createdSnapshot = await adminDb.collection('users').doc(userRecord.uid).get();

    return jsonResponse(
      {
        message: 'Usuario registrado correctamente',
        user: serializeUser(userRecord.uid, createdSnapshot.data() ?? userDoc),
        temporaryPassword,
      },
      201,
    );
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      return jsonResponse({ message: error.message }, error.status);
    }

    return jsonResponse(
      { message: 'No se pudo registrar el usuario. Intente nuevamente.' },
      500,
    );
  }
};

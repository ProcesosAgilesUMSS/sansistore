import type { APIRoute } from 'astro';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '../../lib/firebase-admin';

const ALLOWED_ROLES = ['admin', 'vendedor', 'mensajero', 'operador_inv', 'comprador'] as const;

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

interface UpdateUserRequest {
  uid?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  roles?: string[];
  isActive?: boolean;
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

function getEmailDomain(email: string) {
  return email.split('@')[1] ?? '';
}

function isAllowedInstitutionalEmail(email: string) {
  const domain = getEmailDomain(email);
  return /(?:^|\.)umss\.edu(?:\.|$)/.test(domain);
}

function isValidPhoneNumber(phoneNumber: string) {
  return phoneNumber.length === 8 && /^[67]/.test(phoneNumber);
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
  if (!isAllowedInstitutionalEmail(email)) {
    return {
      error:
        'Solo se permiten dominios institucionales UMSS.',
    };
  }
  if (!phoneNumber) return { error: 'El telefono es obligatorio.' };
  if (!isValidPhoneNumber(phoneNumber)) {
    return {
      error: 'El telefono debe tener 8 digitos e iniciar con 6 o 7.',
    };
  }
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

function validateUpdateUserPayload(payload: UpdateUserRequest) {
  const uid = payload.uid?.trim();
  if (!uid) return { error: 'El uid es obligatorio.' };

  const email = payload.email?.trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Ingrese un correo electronico valido.' };
  }
  if (email && !isAllowedInstitutionalEmail(email)) {
    return {
      error:
        'Solo se permiten dominios institucionales UMSS.',
    };
  }

  const phoneNumber = payload.phoneNumber?.trim();
  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    return {
      error: 'El telefono debe tener 8 digitos e iniciar con 6 o 7.',
    };
  }

  const roles = payload.roles?.map((r) => r.trim());
  if (roles !== undefined) {
    if (roles.length === 0) return { error: 'El usuario debe tener al menos un rol.' };
    if (roles.some((role) => !ALLOWED_ROLES.includes(role as AllowedRole))) {
      return { error: 'Uno o mas roles seleccionados no son validos.' };
    }
  }

  return {
    data: {
      uid,
      ...(payload.displayName?.trim() && { displayName: payload.displayName.trim() }),
      ...(email && { email }),
      ...(phoneNumber && { phoneNumber }),
      ...(roles && { roles: roles as AllowedRole[] }),
      ...(typeof payload.isActive === 'boolean' && { isActive: payload.isActive }),
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

async function emailExistsInFirestore(email: string, excludeUid?: string) {
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

  if (snapshot.empty) return false;
  // Si el único resultado es el mismo usuario que estamos editando, no hay conflicto
  if (excludeUid && snapshot.docs[0].id === excludeUid) return false;
  return true;
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

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const admin = await requireAdmin(request);
    if (admin.error) return admin.error;

    let payload: UpdateUserRequest;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ message: 'El cuerpo de la solicitud no es valido.' }, 400);
    }

    const validation = validateUpdateUserPayload(payload);
    if ('error' in validation) {
      return jsonResponse({ message: validation.error }, 400);
    }

    const { uid, email, roles, isActive, ...rest } = validation.data;

    // Verificar que el usuario existe
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return jsonResponse({ message: 'Usuario no encontrado.' }, 404);
    }

    // Validar email solo si cambió respecto al actual
    const currentData = userDoc.data();
    if (email && email !== currentData?.email) {
      if (await emailExistsInFirestore(email, uid)) {
        return jsonResponse({ message: 'El correo ya esta en uso por otro usuario.' }, 409);
      }
    }

    // Actualizar en Firebase Auth
    await adminAuth.updateUser(uid, {
      ...(rest.displayName && { displayName: rest.displayName }),
      ...(email && { email }),
      ...(typeof isActive === 'boolean' && { disabled: !isActive }),
    });

    // Actualizar custom claims si cambiaron roles
    if (roles) {
      await adminAuth.setCustomUserClaims(uid, { roles });
    }

    // Actualizar en Firestore
    await adminDb.collection('users').doc(uid).update({
      ...rest,
      ...(email && { email }),
      ...(roles && { roles }),
      ...(typeof isActive === 'boolean' && { isActive }),
    });

    const updated = await adminDb.collection('users').doc(uid).get();
    return jsonResponse({
      message: 'Usuario actualizado correctamente.',
      user: serializeUser(uid, updated.data()!),
    });

  } catch (error) {
      if (error instanceof ExternalServiceError) {
        return jsonResponse({ message: error.message }, error.status);
      }
      console.error('PATCH /api/users error:', error);
      return jsonResponse(
        { message: error instanceof Error ? error.message : 'Error desconocido' },
        500,
      );
    }
};
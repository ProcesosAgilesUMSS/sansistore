export const Users = {
  ANA: {
    uid: 'user-ana',
    email: 'ana.comprador@est.umss.edu',
    displayName: 'Ana Mamani',
    photoURL:
      'https://ui-avatars.com/api/?name=Ana+Mamani&background=0D8ABC&color=fff',
    authType: 'google',
    roles: ['comprador'],
    institutionalId: 'EST-2024-001',
    isActive: true,
  },
  CARLOS: {
    uid: 'user-carlos',
    email: 'carlos.docente@est.umss.edu',
    displayName: 'Carlos Flores',
    photoURL:
      'https://ui-avatars.com/api/?name=Carlos+Flores&background=FF6B35&color=fff',
    authType: 'email',
    roles: ['comprador'],
    institutionalId: 'DOC-2023-042',
    isActive: true,
  },
  MARIA: {
    uid: 'user-maria',
    email: 'maria.alvarez@est.umss.edu',
    displayName: 'María Álvarez',
    photoURL:
      'https://ui-avatars.com/api/?name=Maria+Alvarez&background=6B5B95&color=fff',
    authType: 'google',
    roles: ['comprador'],
    institutionalId: 'EST-2024-009',
    isActive: true,
  },
  JUAN: {
    uid: 'user-juan',
    email: 'juan.paredes@est.umss.edu',
    displayName: 'Juan Paredes',
    photoURL:
      'https://ui-avatars.com/api/?name=Juan+Paredes&background=88B04B&color=fff',
    authType: 'email',
    roles: ['comprador'],
    institutionalId: 'EST-2023-015',
    isActive: true,
  },
  PEDRO: {
    uid: 'user-pedro',
    email: 'pedro.vendedor@est.umss.edu',
    displayName: 'Pedro Quiroga',
    photoURL:
      'https://ui-avatars.com/api/?name=Pedro+Quiroga&background=FFA07A&color=fff',
    authType: 'google',
    roles: ['vendedor'],
    institutionalId: 'ADM-2022-010',
    isActive: true,
  },
  LUIS: {
    uid: 'user-luis',
    email: 'luis.mensajero@est.umss.edu',
    displayName: 'Luis Torrez',
    photoURL:
      'https://ui-avatars.com/api/?name=Luis+Torrez&background=20B2AA&color=fff',
    authType: 'email',
    roles: ['mensajero'],
    institutionalId: 'SRV-2023-007',
    isActive: true,
  },
  NADIA: {
    uid: 'user-nadia',
    email: 'nadia.mensajero@est.umss.edu',
    displayName: 'Nadia Guzmán',
    photoURL:
      'https://ui-avatars.com/api/?name=Nadia+Guzman&background=FF69B4&color=fff',
    authType: 'google',
    roles: ['mensajero'],
    institutionalId: 'SRV-2023-011',
    isActive: true,
  },
  ADMIN: {
    uid: 'user-admin',
    email: 'admin@umss.edu',
    displayName: 'Administrador SANSÍ',
    photoURL:
      'https://ui-avatars.com/api/?name=Admin+SANSI&background=2C3E50&color=fff',
    authType: 'email',
    roles: ['admin'],
    institutionalId: 'ADM-2020-001',
    isActive: true,
  },
};

export const userList = Object.values(Users);

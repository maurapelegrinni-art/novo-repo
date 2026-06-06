export type Role = 'admin' | 'assistant';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt?: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  assistant: 'Assistente',
};

/** Permissões derivadas do papel (também reforçadas pelas regras do Firestore). */
export function can(user: AppUser | null) {
  const isAdmin = user?.role === 'admin';
  return {
    manageUsers: isAdmin,
    editPricing: isAdmin,
    deleteRecords: isAdmin,
    manageBackups: isAdmin,
    // staff (admin + assistente) pode operar o dia a dia clínico/financeiro
    editClinical: !!user,
    registerPayments: !!user,
  };
}

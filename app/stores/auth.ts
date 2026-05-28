import { defineStore } from "pinia";
import type { Permission } from "~/types/setting";

export type UserStatus = "active" | "inactive" | "suspended" | "banned";

export interface UserRole {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Permission[];
  pivot?: {
    model_id: string;
    model_type: string;
    role_id: number;
  };
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string; // UUID
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  status: UserStatus;

  // Avatar
  avatar?: string | null;
  avatar_url?: string | null;

  // Spatie Permissions
  roles?: UserRole[];
  permissions?: Permission[];

  // Timestamps
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations
  invited_by_id?: string | null;
  invited_at?: string | null;
}

interface LoginCredentials extends Record<string, unknown> {
  email: string;
  password: string;
  remember?: boolean;
}

interface AuthError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNestedRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

export const useAuthStore = defineStore("auth", () => {
  const toast = useToast();
  const router = useRouter();

  const {
    user: sanctumUser,
    login: sanctumLogin,
    logout: sanctumLogout,
    refreshIdentity,
  } = useSanctumAuth();

  const loading = ref(false);
  const error = ref<AuthError | null>(null);

  // Getters
  const user = computed(() => {
    return sanctumUser.value as User | null;
  });

  const isAuthenticated = computed(() => !!user.value);

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  const hasRole = (roleName: string): boolean => {
    return user.value?.roles?.some((role) => role.name === roleName) ?? false;
  };

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = (permissionName: string): boolean => {
    // Vérifier les permissions directes
    const directPermission = user.value?.permissions?.some(
      (perm) => perm.name === permissionName
    );

    // Vérifier les permissions via les rôles
    const rolePermission = user.value?.roles?.some((role) =>
      role.permissions?.some((perm) => perm.name === permissionName)
    );

    return directPermission || rolePermission || false;
  };

  /**
   * Vérifie si l'utilisateur a au moins un des rôles
   */
  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some((roleName) => hasRole(roleName));
  };

  /**
   * Vérifie si l'utilisateur a toutes les permissions
   */
  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every((permissionName) =>
      hasPermission(permissionName)
    );
  };

  /**
   * Formater les erreurs de l'API
   */
  function formatError(err: unknown): AuthError {
    const errorRecord = isRecord(err) ? err : {};
    const response = getNestedRecord(err, "response");
    const data = getNestedRecord(err, "data") ?? getNestedRecord(response, "_data");

    const rawStatus =
      errorRecord.statusCode ??
      errorRecord.status ??
      response?.status ??
      500;

    const status = typeof rawStatus === "number" ? rawStatus : Number(rawStatus) || 500;

    const rawMessage =
      data?.message ??
      errorRecord.message ??
      "Une erreur est survenue lors de l'authentification.";

    const message = typeof rawMessage === "string"
      ? rawMessage
      : "Une erreur est survenue lors de l'authentification.";

    const rawErrors = data?.errors;
    const errors = isRecord(rawErrors)
      ? Object.fromEntries(
          Object.entries(rawErrors).filter(([, value]) => Array.isArray(value))
        ) as Record<string, string[]>
      : {};

    return { status, message, errors };
  }

  /**
   * Afficher un toast d'erreur
   */
  function showErrorToast(authError: AuthError): void {
    let title = "Erreur de connexion";
    let description = authError.message;
    let icon = "i-lucide-alert-circle";
    let color: "error" | "warning" = "error";

    switch (authError.status) {
      case 401:
        title = "Identifiants incorrects";
        description = "Votre email ou mot de passe est incorrect.";
        icon = "i-lucide-x-circle";
        break;

      case 403:
        title = "Compte inactif";
        description =
          "Votre compte n'est pas actif. Contactez l'administrateur.";
        icon = "i-lucide-alert-triangle";
        color = "warning";
        break;

      case 422:
        title = "Erreur de validation";
        // Extraire la première erreur de validation
        const firstError = Object.values(authError.errors || {})[0]?.[0];
        if (firstError) {
          description = firstError;
        }
        break;

      case 423:
        title = "Compte verrouillé";
        description =
          "Votre compte est temporairement verrouillé suite à plusieurs tentatives échouées.";
        icon = "i-lucide-lock";
        break;

      case 429:
        title = "Trop de tentatives";
        description =
          "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
        icon = "i-lucide-clock";
        color = "warning";
        break;

      case 500:
        title = "Erreur serveur";
        description =
          "Une erreur est survenue sur le serveur. Veuillez réessayer.";
        icon = "i-lucide-server-crash";
        break;
    }

    toast.add({
      title,
      description,
      icon,
      color,
      duration: 5000,
    });
  }

  /**
   * Connexion
   */
  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await sanctumLogin({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        remember: credentials.remember ?? false,
      });

      await refreshIdentity();

      toast.add({
        title: "Connexion réussie",
        description: `Bienvenue ${user.value?.name || ""}!`,
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } catch (err: unknown) {
      const authError = formatError(err);
      error.value = authError;
      showErrorToast(authError);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Déconnexion
   */
  async function logout(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await sanctumLogout();

      toast.add({
        title: "Déconnexion réussie",
        description: "À bientôt!",
        icon: "i-lucide-log-out",
        color: "success",
      });

      // Redirection gérée par nuxt-auth-sanctum
    } catch (err: unknown) {
      const authError = formatError(err);
      error.value = authError;

      if (import.meta.dev) {
        console.error("Erreur lors de la déconnexion", authError);
      }

      toast.add({
        title: "Erreur de déconnexion",
        description: authError.message,
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * Rafraîchir les données utilisateur
   */
  async function refresh(): Promise<void> {
    try {
      await refreshIdentity();
    } catch (err: unknown) {
      const authError = formatError(err);
      error.value = authError;

      if (import.meta.dev) {
        console.error("Erreur lors du rafraîchissement", authError);
      }
    }
  }

  /**
   * Réinitialiser l'erreur
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    user,
    loading,
    error,

    // Getters
    isAuthenticated,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllPermissions,

    // Actions
    login,
    logout,
    refresh,
    refreshIdentity,
    clearError,
  };
});

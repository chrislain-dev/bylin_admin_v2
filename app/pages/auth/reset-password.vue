<script setup lang="ts">
import type { ApiErrorResponse } from '~/types/validation'

definePageMeta({
  layout: 'auth',
  sanctum: {
    excluded: true,
  }
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const client = useSanctumClient()

// Récupérer token et email depuis l'URL
const token = computed(() => route.query.token as string)
const email = computed(() => route.query.email as string)

const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

// Validation en temps réel
const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return { level: 0, text: '', color: '' }

  let strength = 0
  if (pwd.length >= 8) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++

  const levels = [
    { level: 1, text: 'Faible', color: 'red' },
    { level: 2, text: 'Moyen', color: 'orange' },
    { level: 3, text: 'Bon', color: 'yellow' },
    { level: 4, text: 'Fort', color: 'green' },
  ]

  return levels[strength - 1] || { level: 0, text: '', color: '' }
})

const passwordsMatch = computed(() => {
  if (!passwordConfirmation.value) return null
  return password.value === passwordConfirmation.value
})

// Vérifier si le token et l'email sont présents
const isValidLink = computed(() => !!token.value && !!email.value)

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  const apiError = error as ApiErrorResponse
  if (apiError.response?._data?.message) {
    return apiError.response._data.message
  }

  if (apiError.response?._data?.errors) {
    const errors = apiError.response._data.errors
    const firstError = Object.values(errors)[0]
    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0] as string
    }
  }

  return 'Une erreur est survenue.'
}

const handleResetPassword = async () => {
  // Validation côté client
  if (!password.value || !passwordConfirmation.value) {
    toast.add({
      title: 'Champs requis',
      description: 'Veuillez remplir tous les champs.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  if (password.value.length < 8) {
    toast.add({
      title: 'Mot de passe trop court',
      description: 'Le mot de passe doit contenir au moins 8 caractères.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  if (password.value !== passwordConfirmation.value) {
    toast.add({
      title: 'Erreur',
      description: 'Les mots de passe ne correspondent pas.',
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
    return
  }

  loading.value = true

  try {
    await client('/api/v1/auth/admin/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        email: email.value,
        password: password.value,
        password_confirmation: passwordConfirmation.value
      }
    })

    toast.add({
      title: 'Succès !',
      description: 'Votre mot de passe a été réinitialisé avec succès.',
      color: 'success',
      icon: 'i-lucide-check-circle',
      duration: 5000
    })

    // Redirection vers la page de connexion après 1.5s
    setTimeout(() => {
      router.push('/auth/login')
    }, 1500)

  } catch (error: unknown) {
    const message = getErrorMessage(error)

    toast.add({
      title: 'Erreur',
      description: message,
      color: 'error',
      icon: 'i-lucide-x-circle',
      duration: 7000
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-8 animate-fade-in-up">

    <!-- Header -->
    <div class="text-center lg:text-left">
      <div class="lg:hidden flex justify-center mb-6">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-lg">
          <UIcon name="i-lucide-lock-keyhole" class="w-7 h-7" />
        </div>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Nouveau mot de passe
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Créez un mot de passe sécurisé pour votre compte.
      </p>
    </div>

    <!-- Lien invalide -->
    <div
      v-if="!isValidLink"
      class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 text-center space-y-4"
    >
      <div class="flex justify-center">
        <UIcon name="i-lucide-alert-triangle" class="w-12 h-12 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h3 class="font-medium text-red-900 dark:text-red-300">Lien invalide</h3>
        <p class="text-sm text-red-700 dark:text-red-400 mt-1">
          Le lien de réinitialisation est invalide ou incomplet.
        </p>
      </div>
      <UButton to="/auth/forgot-password" variant="outline" color="error" block class="mt-2">
        Demander un nouveau lien
      </UButton>
    </div>

    <!-- Formulaire -->
    <form v-else class="space-y-6" @submit.prevent="handleResetPassword">

      <!-- Email (lecture seule) -->
      <UFormField label="Adresse Email" name="email">
        <UInput
          :model-value="email"
          type="email"
          icon="i-lucide-mail"
          size="lg"
          disabled
          class="w-full opacity-75"
        />
      </UFormField>

      <!-- Nouveau mot de passe -->
      <UFormField label="Nouveau mot de passe" name="password">
        <div class="space-y-2">
          <div class="relative">
            <UInput
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              icon="i-lucide-lock"
              placeholder="••••••••"
              size="lg"
              autofocus
              class="w-full pr-12"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <UIcon
                :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="w-5 h-5"
              />
            </button>
          </div>

          <!-- Indicateur de force -->
          <div v-if="password" class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-500 dark:text-gray-400">Force du mot de passe</span>
              <span
                :class="{
                  'text-red-600 dark:text-red-400': passwordStrength.color === 'red',
                  'text-orange-600 dark:text-orange-400': passwordStrength.color === 'orange',
                  'text-yellow-600 dark:text-yellow-400': passwordStrength.color === 'yellow',
                  'text-green-600 dark:text-green-400': passwordStrength.color === 'green',
                }"
                class="font-medium"
              >
                {{ passwordStrength.text }}
              </span>
            </div>
            <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                :class="{
                  'bg-red-500': passwordStrength.color === 'red',
                  'bg-orange-500': passwordStrength.color === 'orange',
                  'bg-yellow-500': passwordStrength.color === 'yellow',
                  'bg-green-500': passwordStrength.color === 'green',
                }"
                class="h-full transition-all duration-300"
                :style="{ width: `${(passwordStrength.level / 4) * 100}%` }"
              />
            </div>
          </div>

          <!-- Critères de sécurité -->
          <ul class="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-2">
            <li :class="password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''">
              <UIcon :name="password.length >= 8 ? 'i-lucide-check' : 'i-lucide-circle'" class="w-3 h-3 inline" />
              Au moins 8 caractères
            </li>
            <li :class="(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? 'text-green-600 dark:text-green-400' : ''">
              <UIcon :name="(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? 'i-lucide-check' : 'i-lucide-circle'" class="w-3 h-3 inline" />
              Majuscules et minuscules
            </li>
            <li :class="/\d/.test(password) ? 'text-green-600 dark:text-green-400' : ''">
              <UIcon :name="/\d/.test(password) ? 'i-lucide-check' : 'i-lucide-circle'" class="w-3 h-3 inline" />
              Au moins un chiffre
            </li>
            <li :class="/[^a-zA-Z0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : ''">
              <UIcon :name="/[^a-zA-Z0-9]/.test(password) ? 'i-lucide-check' : 'i-lucide-circle'" class="w-3 h-3 inline" />
              Au moins un caractère spécial
            </li>
          </ul>
        </div>
      </UFormField>

      <!-- Confirmation du mot de passe -->
      <UFormField label="Confirmer le mot de passe" name="password_confirmation">
        <div class="space-y-2">
          <div class="relative">
            <UInput
              v-model="passwordConfirmation"
              :type="showPasswordConfirmation ? 'text' : 'password'"
              icon="i-lucide-lock"
              placeholder="••••••••"
              size="lg"
              class="w-full pr-12"
            />
            <button
              type="button"
              @click="showPasswordConfirmation = !showPasswordConfirmation"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <UIcon
                :name="showPasswordConfirmation ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="w-5 h-5"
              />
            </button>
          </div>

          <!-- Indicateur de correspondance -->
          <div v-if="passwordConfirmation" class="flex items-center gap-2 text-xs">
            <UIcon
              :name="passwordsMatch ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              :class="passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              class="w-4 h-4"
            />
            <span
              :class="passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas' }}
            </span>
          </div>
        </div>
      </UFormField>

      <!-- Bouton de soumission -->
      <UButton
        type="submit"
        block
        size="lg"
        :loading="loading"
        :disabled="!password || !passwordConfirmation || !passwordsMatch"
        class="bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200"
      >
        <template #leading>
          <UIcon name="i-lucide-check" class="w-5 h-5" />
        </template>
        Réinitialiser le mot de passe
      </UButton>

      <!-- Lien retour -->
      <div class="text-center">
        <NuxtLink
          to="/auth/login"
          class="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          Retour à la connexion
        </NuxtLink>
      </div>
    </form>

  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

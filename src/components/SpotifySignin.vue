<template>
  <q-field
    :label="label"
    stack-label
    :hint="hint"
    :model-value="modelValue"
    :rules="[(val) => !required || !!(val && val.token) || 'You must sign in to Spotify.']"
  >
    <template v-slot:default>
      <a
        v-if="store.isSignedIn"
        :href="store.currentUser?.external_urls.spotify"
        target="_blank"
        rel="noopener noreferrer"
      >
        <q-chip clickable size="small">
          <q-avatar>
            <q-img :src="store.currentUser?.images?.[0]?.url" alt="Profile Image" />
          </q-avatar>
          <span class="username">{{ store.currentUser?.display_name }}</span>
        </q-chip>
      </a>
      <span class="text-warning" v-else>Not Signed In</span>
    </template>
    <template v-slot:prepend>
      <q-btn
        v-if="store.isSignedIn"
        label="Sign Out"
        :icon="ionLogOutOutline"
        @click="store.logout()"
      />
      <q-btn v-else color="green" label="Sign in with Spotify" :icon="mdiSpotify">
        <q-popup-proxy ref="popup">
          <q-form class="q-gutter-md q-pa-lg" ref="inlineForm">
            <q-input
              label="Client ID"
              v-model="authConfig.clientId"
              :rules="[
                (val) =>
                  (val && val.match(/^[a-z0-9]{32}$/)) ||
                  'That does not look like a valid Client ID.',
              ]"
            />
            <q-input
              label="Client Secret"
              v-model="authConfig.clientSecret"
              type="password"
              :rules="[
                (val) =>
                  (val && val.match(/^[a-z0-9]{32}$/)) ||
                  'That does not look like a valid Client Secret.',
              ]"
            />
            <q-btn label="What is this?" @click="showDialog = true" />
            <q-btn label="Sign In" color="primary" @click="startSpotifySignin" />
          </q-form>
        </q-popup-proxy>
      </q-btn>
    </template>
  </q-field>

  <q-dialog v-model="showDialog">
    <q-card>
      <q-card-section>
        <div class="text-h6">Getting Your Spotify App</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <ol>
          <li>
            Go to
            <a
              href="https://developer.spotify.com/dashboard/login"
              target="_blank"
              rel="noreferer noopener"
            >
              Spotify Developer Dashboard <q-icon :name="ionOpenOutline" />
            </a>
            , and log in using your Spotify account.
          </li>
          <li>Once you're logged in, click "Create An App"</li>
          <li>
            Enter anything in "App Name", "App Description", accept the terms, and click "Create".
          </li>
          <li>
            Click on "Edit Settings". Under "Redirect URIs", add the following URL: <br />
            <code>{{ store.REDIRECT_URI }}</code>
          </li>
          <li>Click "Save" at the very bottom of the page.</li>
          <li>
            On the dashboard page, you'll find your Client ID and Client Secret (which you will need
            to click a button to see). Copy and paste both of those into this form to log in.
          </li>
        </ol>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <strong>Why?</strong> Spotify does not allow anyone other than the developer to use
        applications they have not approved. Their TOS explicitly says hobby projects will never be
        approved so I cannot set up this tool to work seamlessly. You will have to create your own
        Spotify developer account to get around this limitation.
      </q-card-section>

      <q-card-actions class="q-pt-none"> </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ionLogOutOutline } from '@quasar/extras/ionicons-v6';
import { mdiSpotify } from '@quasar/extras/mdi-v7';
import { ionOpenOutline } from '@quasar/extras/ionicons-v6';
import { storeToRefs } from 'pinia';
import authStore, { SpotifyAuth } from 'src/stores/SpotifyAuth';
import { ref, watch } from 'vue';
import { QForm, QPopupProxy } from 'quasar';
import { useStorage } from '@vueuse/core';

withDefaults(
  defineProps<{
    modelValue?: SpotifyAuth;
    label?: string;
    hint?: string;
    required?: boolean;
  }>(),
  {
    label: 'Spotify',
  }
);

const emit = defineEmits(['update:modelValue']);
const authConfig = useStorage('spotify.authConfig', { clientId: '', clientSecret: '' });
const inlineForm = ref<QForm>();
const popup = ref<QPopupProxy>();
const showDialog = ref(false);

const store = authStore();
const { auth } = storeToRefs(store);

watch(auth, (newAuth) => emit('update:modelValue', newAuth), { immediate: true });

async function startSpotifySignin() {
  if (inlineForm.value) {
    const validated = await inlineForm.value.validate();
    if (validated) {
      store.setApp(authConfig.value.clientId, authConfig.value.clientSecret);
      window.open(store.getSigninUrl(), 'SpotifySignIn', 'popup,width=480,height=640');
      if (popup.value) {
        popup.value.hide();
      }
    }
  }
}
</script>

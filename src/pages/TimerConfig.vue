<template>
  <q-page class="q-ma-xl q-gutter-md">
    <h5>Twitch Timer</h5>
    <p>
      A timer that counts either up or down on your stream that can be controlled by people in chat.
      You can control it using the following commands:
    </p>
    <q-list>
      <q-item>
        <q-item-section>
          <q-item-label><code>!timer {time} {title}</code></q-item-label>
          <q-item-label caption>
            Start a new countdown timer. Time should be in the format <code>1d2h3m4s</code>. Title
            is optional, and will be displayed under the timer. For example,
            <code>!timer 5m30s Gamba</code>
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label><code>!timer up {title}</code></q-item-label>
          <q-item-label caption>
            Start a new countup timer. Title is optional, and will be displayed under the timer. If
            there is already a timer with the given title, it will be replaced.
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-item-label><code>!timer off {number or title}</code></q-item-label>
          <q-item-label caption>
            Stops an existing timer and removes it from stream. If a number it used, this removes
            the number-th timer on stream, starting with 1. If a title is given, the timer with
            matching title is removed.
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <q-form ref="form">
      <h5>Configuration</h5>
      <twitch-signin
        v-model="config.twitchAuth"
        @update:model-value="autofillChannel"
        hint="Optional. If you sign in, the timer will be able to respond to commands in chat."
      />

      <q-input
        v-model="config.channelName"
        label="Twitch Channel"
        hint="Twitch Channel to listen for message in"
        :rules="[(val) => !!val || 'A channel name is required.']"
      />

      <q-select
        label="Minimum User Role to Use Timer"
        hint="Commands from users without at least the selected permissions will be ignored"
        v-model="config.minRole"
        :options="['broadcaster', 'moderator', 'vip', 'subscriber']"
      />

      <h5>Customization</h5>

      <div class="q-gutter-sm row items-start">
        <color-picker-input v-model="config.colors.time" label="Time Color" />
        <color-picker-input v-model="config.colors.done" label="Timer Ended Color" />
        <color-picker-input v-model="config.colors.border" label="Time Border" />
        <color-picker-input v-model="config.colors.shadow" label="Time Shadow" />
        <color-picker-input v-model="config.colors.text" label="Text Color" />
        <color-picker-input v-model="config.colors.textShadow" label="Text Shadow" />
      </div>
      <q-field label="Text Alignment" v-model="config.textAlign" stack-label>
        <q-btn-toggle
          v-model="config.textAlign"
          :options="[
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ]"
        />
      </q-field>
      <slider-field
        label="Flashing Animation Speed"
        unit="ms"
        v-model="config.animationSpeed"
        :min="200"
        :max="4000"
        :step="100"
      />
      <slider-field
        label="Timer Font Size"
        unit="px"
        v-model="config.size.time"
        :min="8"
        :max="300"
      />
      <slider-field
        label="Title Font Size"
        unit="px"
        v-model="config.size.title"
        :min="8"
        :max="120"
      />

      <!-- animationSpeed: 500, -->
    </q-form>
    <h5>Preview</h5>
    <resizable-preview :default-width="820" :default-height="590">
      <timer-widget v-bind="config" preview />
    </resizable-preview>

    <h5>Broadcaster Software Settings</h5>
    <generate-copy-widget-link route-name="TimerWidget" :config="config" :form="form" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QForm } from 'quasar';

import ColorPickerInput from 'src/components/ColorPickerInput.vue';
import TwitchSignin from 'src/components/TwitchSignin.vue';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { TimerWidgetOptions } from './widgets/TimerWidget.vue';
import ResizablePreview from 'src/components/ResizablePreview.vue';
import TimerWidget from './TimerWidget.vue';
import SliderField from 'src/components/SliderField.vue';
import { useStorage } from '@vueuse/core';
import GenerateCopyWidgetLink from 'src/components/GenerateCopyWidgetLink.vue';

const form = ref({} as QForm);

const config = useStorage('timer.config', {
  channelName: '',
  colors: {
    time: '#ffbb00ff',
    done: '#ff6644ff',
    border: '#00000099',
    shadow: '#00000099',
    text: '#ffbb00ff',
    textShadow: '#000000aa',
  },
  size: {
    time: 180,
    title: 48,
  },
  minRole: 'moderator',
  textAlign: 'right',
  animationSpeed: 1000,
} as TimerWidgetOptions);

function autofillChannel(auth: { username: string }) {
  if (auth && !config.value.channelName) {
    config.value.channelName = auth.username;
  }
}
</script>

<style scoped lang="sass">
.q-form
  max-width: 960px
</style>

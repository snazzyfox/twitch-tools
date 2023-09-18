<template>
  <q-page class="q-ma-xl q-gutter-md">
    <div class="text-h4">Twitch Timer</div>
    <p>
      A timer that counts either up or down on your stream that can be controlled by people in chat.
      You can control it using the following commands:
    </p>
    <q-list>
      <q-item>
        <q-item-section>
          <q-item-label><code>!timer {time} {title}</code></q-item-label>
          <q-item-label caption>
            <p>
              Set a countdown timer. Time should be in the format <code>1d2h3m4s</code>. Title is
              optional, and will be displayed under the timer. For example,
              <code>!timer 5m30s Gamba</code>
            </p>

            <p>
              If a timer with the given title already exists, it will be updated. You can also place
              a plus (&plus;) or minus (&minus;) before the time to add or subtract time to the
              existing timer instead of overwriting it with a new time.
            </p>
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
      <div class="text-h5 q-my-md">Configuration</div>
      <twitch-signin v-model="config.twitchAuth" @update:model-value="autofillChannel" />
      <twitch-channel-selection
        v-model="config.channelName"
        label="Twitch Channel"
        hint="Twitch Channel to listen for message in"
      />

      <q-select
        label="Minimum User Role to Use Timer"
        hint="Commands from users without at least the selected permissions will be ignored"
        v-model="config.minRole"
        :options="['broadcaster', 'moderator', 'vip', 'subscriber']"
      />

      <div class="text-h5 q-my-md">Customization</div>

      <div class="q-gutter-sm row items-start">
        <color-picker-input v-model="config.colors.time" label="Time Color" />
        <color-picker-input v-model="config.colors.done" label="Timer Ended Color" />
        <color-picker-input v-model="config.colors.border" label="Time Border" />
        <color-picker-input v-model="config.colors.shadow" label="Time Shadow" />
        <color-picker-input v-model="config.colors.text" label="Text Color" />
        <color-picker-input v-model="config.colors.textShadow" label="Text Shadow" />
        <q-field label="Text Alignment" v-model="config.textAlign" stack-label borderless>
          <q-radio v-model="config.textAlign" label="Left" val="left" />
          <q-radio v-model="config.textAlign" label="Right" val="right" />
        </q-field>
      </div>
      <div class="q-gutter-sm row">
        <font-picker
          class="col-4"
          v-model="config.font.time"
          label="Timer Font"
          preview-text="1:23:45"
        />
        <slider-field
          class="col-3"
          label="Timer Font Size"
          unit="px"
          v-model="config.size.time"
          :min="8"
          :max="300"
        />
        <slider-field
          class="col-3"
          label="Timer Line Height"
          unit="em"
          v-model="config.size.timeLineHeight"
          :min="0.1"
          :max="3.0"
          :step="0.05"
        />
      </div>
      <div class="q-gutter-sm row">
        <font-picker class="col-4" v-model="config.font.title" label="Title Font" />
        <slider-field
          class="col-3"
          label="Title Font Size"
          unit="px"
          v-model="config.size.title"
          :min="8"
          :max="120"
        />
        <slider-field
          class="col-3"
          label="Title Line Height"
          unit="em"
          v-model="config.size.titleLineHeight"
          :min="0.1"
          :max="3.0"
          :step="0.05"
        />
      </div>
      <slider-field
        label="Flashing Animation Speed"
        unit="ms"
        v-model="config.animationSpeed"
        :min="200"
        :max="4000"
        :step="100"
      />
    </q-form>
    <div class="text-h5 q-my-md">Preview</div>
    <resizable-preview v-if="config.channelName" :default-width="820" :default-height="590">
      <timer-widget v-bind="config" preview />
    </resizable-preview>

    <div class="text-h5 q-my-md">Broadcaster Software Settings</div>
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
import FontPicker from 'src/components/FontPicker.vue';
import ResizablePreview from 'src/components/ResizablePreview.vue';
import TimerWidget from './TimerWidget.vue';
import SliderField from 'src/components/SliderField.vue';
import { useStorage } from '@vueuse/core';
import GenerateCopyWidgetLink from 'src/components/GenerateCopyWidgetLink.vue';
import TwitchChannelSelection from 'src/components/TwitchChannelSelection.vue';

const form = ref({} as QForm);

const config = useStorage(
  'timer.config',
  {
    channelName: '',
    colors: {
      time: '#ffbb00ff',
      done: '#ff6644ff',
      border: '#00000099',
      shadow: '#00000099',
      text: '#ffbb00ff',
      textShadow: '#000000aa',
    },
    font: {
      time: 'Digital-7 Mono',
      title: 'Bebas Neue',
    },
    size: {
      time: 180,
      timeLineHeight: 1,
      title: 48,
      titleLineHeight: 1,
    },
    minRole: 'moderator',
    textAlign: 'right',
    animationSpeed: 1000,
  } as TimerWidgetOptions,
  undefined,
  {
    mergeDefaults: true,
  }
);

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

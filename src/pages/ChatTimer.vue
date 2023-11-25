<template>
  <q-page class="q-ma-xl q-gutter-md page-width">
    <div class="text-h4">Chat-Based Twitch Timer</div>
    <p>
      A timer that counts down or up in your Twitch chat. Control the timer on this page. This page
      must remain open at all times for the timer to continue running.
    </p>
    <p>
      This tool can potentially get spammy. You must be the moderator of a channel to use this tool.
    </p>
    <q-form ref="form" v-show="!isTimerRunning">
      <div class="text-h5 q-my-md">Configuration</div>
      <twitch-signin v-model="config.twitchAuth" @update:model-value="autofillChannel" />
      <twitch-channel-selection
        v-model="config.channelName"
        v-model:user-id="config.twitchUserId"
        label="Twitch Channel"
        hint="Twitch Channel to send timing messages to"
        required
      />

      <div class="q-gutter-md row">
        <q-input type="number" v-model.number="config.totalTime.minutes" suffix="minutes" />
        <q-input type="number" v-model.number="config.totalTime.seconds" suffix="seconds" />
      </div>

      <q-input
        type="number"
        v-model.number="config.countdownSeconds"
        label="Countdown Time (seconds)"
        hint="Number of seconds to count down before starting the actual timer"
      />
      <q-field
        label="Message Interval (seconds)"
        v-model="config.messageIntervalSeconds"
        hint="Send a chat message every this many seconds"
      >
        <q-slider
          v-model="config.messageIntervalSeconds"
          :min="5"
          :max="120"
          :step="5"
          snap
          label
          label-always
        />
      </q-field>
      <q-field
        label="Final Countdown Time (seconds)"
        v-model="config.finalCountdownSeconds"
        hint="Send a chat message every second during the last few seconds"
      >
        <q-slider
          v-model="config.finalCountdownSeconds"
          :min="0"
          :max="15"
          snap
          label
          label-always
        />
      </q-field>
      <q-checkbox v-model="config.useAnnounce" label="Send messages as announcements." />
    </q-form>

    <div class="q-mt-lg">
      <q-btn-group>
        <q-btn
          v-if="!isTimerRunning"
          color="primary"
          :icon="ionTimerOutline"
          @click="startTimer"
          :disabled="!config.twitchAuth || !config.channelName"
          >Start Timer</q-btn
        >
      </q-btn-group>
      <div v-if="isTimerRunning">
        <q-banner class="bg-info text-white">
          <template v-slot:avatar>
            <q-circular-progress
              :value="timeRemainingSec!"
              :min="0"
              :max="totalSeconds"
              size="48px"
              color="orange"
            />
          </template>
          <div>
            Timer is running! Time remaining:
            <code class="text-h4">{{ formatTime(timeRemainingSec) }}</code>
          </div>
          <div>
            Last chat message sent at: <code class="text-h4">{{ formatTime(lastSentTime) }}</code>
          </div>
          <template v-slot:action>
            <q-btn color="negative" :icon="ionStopCircleOutline" @click="stopTimer"
              >Stop Timer Now</q-btn
            >
          </template>
        </q-banner>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { QForm } from 'quasar';

import TwitchSignin from 'src/components/TwitchSignin.vue';
import { useStorage } from '@vueuse/core';
import TwitchChannelSelection from 'src/components/TwitchChannelSelection.vue';

import { ionTimerOutline, ionStopCircleOutline } from '@quasar/extras/ionicons-v6';
import tmi from 'tmi.js';
import { sendAnnouncement } from 'src/api/twitch';

interface ChatTimerOptions {
  channelName: string;
  totalTime: { minutes: number; seconds: number };
  twitchAuth?: { username: string; token: string };
  twitchUserId?: number;
  countdownSeconds: number;
  messageIntervalSeconds: number;
  finalCountdownSeconds: number;
  timerEndTime: number | null;
  useAnnounce: boolean;
}

const form = ref({} as QForm);
const config = useStorage('chatTimer.config', {
  channelName: '',
  totalTime: { minutes: 5, seconds: 0 },
  countdownSeconds: 5,
  messageIntervalSeconds: 60,
  finalCountdownSeconds: 5,
  timerEndTime: null,
  useAnnounce: false,
} as ChatTimerOptions);
const isTimerRunning = computed(() => config.value.timerEndTime !== null);
const totalSeconds = computed(
  () => config.value.totalTime.minutes * 60 + config.value.totalTime.seconds
);
const timeRemainingSec = ref<number | null>(null);
const lastSentTime = ref<number | null>(null);
let interval: number | undefined;
let client: tmi.Client;

onMounted(() => {
  if (config.value.timerEndTime) {
    runTimer();
  }
});

function autofillChannel(auth: { username: string }) {
  if (auth && !config.value.channelName) {
    config.value.channelName = auth.username;
  }
}

function postTimeRemaining() {
  if (config.value.timerEndTime !== null) {
    timeRemainingSec.value = Math.floor((config.value.timerEndTime - Date.now()) / 1000);
    if (!lastSentTime.value || timeRemainingSec.value < lastSentTime.value) {
      if (timeRemainingSec.value > totalSeconds.value) {
        // initial countdown
        const seconds = timeRemainingSec.value - totalSeconds.value;
        const message = 'Get ready in ' + seconds.toString();
        send(message);
        lastSentTime.value = timeRemainingSec.value;
      } else if (timeRemainingSec.value == totalSeconds.value) {
        send('GO! GO! GO!');
        lastSentTime.value = timeRemainingSec.value;
      } else {
        // actual timer
        const minutes = Math.floor(timeRemainingSec.value / 60) % 60;
        const seconds = timeRemainingSec.value % 60;
        if (minutes <= 0 && seconds <= 0) {
          send('TIME IS UP!');
          stopTimer();
        } else if (
          timeRemainingSec.value % config.value.messageIntervalSeconds === 0 || // at reporting interval
          timeRemainingSec.value <= config.value.finalCountdownSeconds // final countdown
        ) {
          let message = '';
          if (minutes > 0) message += minutes.toString() + ' minutes ';
          if (seconds > 0) message += seconds.toString() + ' seconds ';
          message += 'remaining...';
          send(message);
          lastSentTime.value = timeRemainingSec.value;
        }
      }
    }
  }
}

async function send(message: string) {
  if (config.value.useAnnounce) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await sendAnnouncement(config.value.twitchUserId!.toString(), message);
  } else {
    client.say(config.value.channelName, message);
  }
}

function startTimer() {
  const millis = (totalSeconds.value + config.value.countdownSeconds) * 1_000;
  config.value.timerEndTime = Date.now() + millis + 1500; // half second buffer
  runTimer();
}

async function runTimer() {
  if (!config.value.useAnnounce && config.value.twitchAuth) {
    client = new tmi.Client({
      identity: {
        username: config.value.twitchAuth.username,
        password: 'oauth:' + config.value.twitchAuth.token,
      },
      channels: [config.value.channelName],
      options: {
        skipMembership: true,
        skipUpdatingEmotesets: true,
      },
    });
    await client.connect();
  }
  interval = window.setInterval(postTimeRemaining, 500);
}

async function stopTimer() {
  if (!config.value.useAnnounce) {
    await client.disconnect();
  }
  config.value.timerEndTime = null;
  timeRemainingSec.value = null;
  lastSentTime.value = null;
  clearInterval(interval);
}

function formatTime(seconds: number | null) {
  if (seconds === null) {
    return '(unknown)';
  } else {
    return (
      Math.floor(seconds / 60).toString() +
      ':' +
      (Math.floor(seconds) % 60).toString().padStart(2, '0')
    );
  }
}
</script>

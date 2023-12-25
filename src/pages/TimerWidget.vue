<template>
  <div class="timer-wrapper">
    <transition-group>
      <div v-for="timer in state" :key="timer.title" class="timer-container">
        <div class="time" :class="{ done: timer.done }">{{ timer.time }}</div>
        <div class="title">{{ timer.title }}</div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { onMounted, onUnmounted, ref } from 'vue';
import { useFont } from 'src/components/FontPickerUtils';
import { TmiClientWrapper } from 'src/api/twitch';
import { ChatUserstate } from 'tmi.js';

export interface TimerWidgetOptions {
  preview?: boolean;
  twitchAuth?: { username: string; token: string };
  channelName: string;
  colors: {
    time: string;
    done: string;
    border: string;
    shadow: string;
    text: string;
    textShadow: string;
  };
  font?: {
    time: string;
    title: string;
  };
  size: {
    time: number;
    timeLineHeight?: number;
    title: number;
    titleLineHeight?: number;
  };
  animationSpeed: number;
  textAlign: 'left' | 'right';
  minRole: 'broadcaster' | 'moderator' | 'vip' | 'subscriber';
}

interface TimerData {
  time: number;
  direction: 'up' | 'down';
  title: string;
}

interface TimerState {
  time: string;
  done: boolean;
  title: string;
}

const props = defineProps<TimerWidgetOptions>();
const timerData = useStorage<TimerData[]>('timer.state', []);
const state = ref<TimerState[]>([]);
const COMMAND_COOLDOWN_MS = 5000;
let cooldownUntil = 0;
const chat = new TmiClientWrapper();

chat.on('chat', async (channel, userstate, message, self) => {
  const [command] = message.split(/\s+/, 1);
  if (!self && command === '!timer') {
    if (!hasPermissions(userstate)) {
      return;
    }
    const now = Date.now();
    if (cooldownUntil > now) return;
    const [, firstToken, ...restTokens] = message.split(/\s+/);
    const title = restTokens.length ? restTokens.join(' ') : '';
    if (firstToken === 'off') {
      removeTimer(title);
    } else {
      addTimer(firstToken, title);
    }
    cooldownUntil = now + COMMAND_COOLDOWN_MS;
  }
});

let interval = -1;
onMounted(async () => {
  if (props.preview) {
    state.value = [
      { time: '00:00', done: true, title: 'Test Timer: Done' },
      { time: '1:23:45', done: false, title: 'Test Timer: Not Done' },
      { time: '1:23:45:00', done: false, title: 'Test Timer: Long' },
    ];
  } else {
    interval = window.setInterval(updateState, 500);
    chat.setAuth([props.channelName]);
    await chat.connect();
  }
});

onUnmounted(async () => {
  clearInterval(interval);
  await chat.disconnect();
});

useFont(props.font?.time || 'Digital-7 Mono');
useFont(props.font?.title || 'Bebas Neue');

function hasPermissions(userstate: ChatUserstate) {
  switch (props.minRole) {
    case 'broadcaster':
      return !!userstate.badges?.broadcaster;
    case 'moderator':
      return !!userstate.badges?.broadcaster || userstate.mod || false;
    case 'vip':
      return !!userstate.badges?.broadcaster || userstate.mod || userstate.vip;
    case 'subscriber':
      return (
        !!userstate.badges?.broadcaster || userstate.mod || userstate.vip || userstate.subscriber
      );
  }
}

/** Update the state timers are drawn based on */
function updateState() {
  const now = Date.now();
  state.value = timerData.value.map(({ time, title, direction }) => {
    const durationMs = direction === 'down' ? time - now : now - time;
    const formatted = formatTime(durationMs);
    return { time: formatted, done: durationMs < 100, title };
  });
}

function padNumber(num: number) {
  return num.toString().padStart(2, '0');
}

/** Formats time as days:hours:minutes:seconds */
function formatTime(milliseconds: number) {
  if (milliseconds > 500) {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor(milliseconds / (60 * 60 * 1000)) % 24;
    const minutes = Math.floor(milliseconds / (60 * 1000)) % 60;
    const seconds = Math.floor(milliseconds / 1000) % 60;
    let formatted = '';
    if (days > 0) {
      formatted += days.toString() + ':';
    }
    if (hours > 0) {
      formatted += padNumber(hours) + ':';
    }
    formatted += padNumber(minutes) + ':' + padNumber(seconds);
    return formatted;
  } else {
    return '00:00';
  }
}

function getTimerIndex(title: string) {
  return timerData.value.findIndex(
    (timer) => timer.title.trim().toLowerCase() === title.trim().toLowerCase()
  );
}

function addTimer(duration: string, title: string) {
  const existingIndex = getTimerIndex(title);
  if (duration === 'up') {
    const newTimer: TimerData = { time: Date.now(), direction: 'up', title };
    if (existingIndex > -1) {
      timerData.value[existingIndex] = newTimer;
    } else {
      timerData.value.push(newTimer);
    }
  } else {
    const match = duration.match(
      /^(?<sign>\+|-)?(?:(?<d>\d+)d)?(?:(?<h>\d+)h)?(?:(?<m>\d+)m)?(?:(?<s>\d+)s)?$/i
    );
    if (match && match.groups) {
      const millis =
        Number(match.groups.d || 0) * 86_400_000 + // days
        Number(match.groups.h || 0) * 3_600_000 + // seconds
        Number(match.groups.m || 0) * 60_000 + // minutes
        Number(match.groups.s || 0) * 1_000; // seconds
      // extra half second buffer
      if (existingIndex > -1) {
        if (match.groups.sign === '+') {
          timerData.value[existingIndex].time += millis;
        } else if (match.groups.sign === '-') {
          timerData.value[existingIndex].time -= millis;
        } else {
          timerData.value[existingIndex].time = Date.now() + millis + 500;
        }
      } else {
        timerData.value.push({ time: Date.now() + millis + 500, direction: 'down', title });
      }
    } else {
      return 'The duration you provided is not valid.';
    }
  }
}

function removeTimer(title: string) {
  // See if a timer with the given title can be found
  let index = getTimerIndex(title);
  if (index === -1) {
    index = parseInt(title[0]) - 1;
  }
  if (index >= 0 && index < timerData.value.length) {
    timerData.value.splice(index, 1);
  } else {
    return 'Cannot find a timer to turn off.';
  }
}
</script>

<style scoped lang="sass">
.timer-wrapper
  overflow: hidden
  padding: 0.1em

.timer-container
  margin-bottom: .25em
  text-align: v-bind("$props.textAlign")
  width: 100%

.time
  color: v-bind("$props.colors.time")
  -webkit-text-stroke: 1px v-bind("$props.colors.border")
  text-shadow: 4px 4px v-bind("$props.colors.shadow")
  font-family: v-bind("$props.font?.time || 'Digital-7 Mono'"), "Courier New", monospace
  font-size: v-bind("$props.size.time + 'px'")
  line-height: v-bind("($props.size?.timeLineHeight || 1) + 'em'")
  margin-bottom: -0.1em

  &.done
    @keyframes flash
      0%, 40%
        color: v-bind("$props.colors.time")
      50%, 90%
        color: v-bind("$props.colors.done")
    animation: flash v-bind("$props.animationSpeed + 'ms'") infinite

.title
  color: v-bind("$props.colors.text")
  text-shadow: 3px 3px v-bind("$props.colors.textShadow")
  font-family: v-bind("$props.font?.title || 'Bebas Neue'"), sans-serif
  font-size: v-bind("$props.size.title + 'px'")
  line-height: v-bind("($props.size?.titleLineHeight || 1) + 'em'")
  font-weight: 600
  width: 100%

.v-enter-active, .v-leave-active
  transition: all 0.5s ease

.v-enter-from, .v-leave-to
  opacity: 0
  transform: translateX(80px)
</style>

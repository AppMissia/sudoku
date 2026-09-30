// src/utils/haptics.ts
/** Simple wrapper around the Vibration API */
export const vibrateLight = (): void => {
  if (navigator.vibrate) navigator.vibrate(12); // ~12 ms pulse
};

export const vibrateError = (): void => {
  if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
};

export const vibrateSuccess = (): void => {
  if (navigator.vibrate) navigator.vibrate([30, 50, 60, 50, 100]);
};

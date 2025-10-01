"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Chip, Input, Progress, Tab, Tabs } from "@heroui/react";

const STAGES = {
  focus: { key: "focus", label: "集中", description: "集中タイム", minutes: 25 },
  shortBreak: { key: "shortBreak", label: "小休憩", description: "短い休憩", minutes: 5 },
  longBreak: { key: "longBreak", label: "長休憩", description: "深呼吸タイム", minutes: 15 },
};

const STAGE_ORDER = ["focus", "shortBreak", "longBreak"];
const LONG_BREAK_INTERVAL = 4;

const toSeconds = (minutes) => minutes * 60;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function Home() {
  const [durations, setDurations] = useState(() =>
    Object.fromEntries(
      STAGE_ORDER.map((stage) => [stage, STAGES[stage].minutes])
    )
  );
  const [currentStage, setCurrentStage] = useState("focus");
  const [timeRemaining, setTimeRemaining] = useState(() =>
    toSeconds(STAGES.focus.minutes)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);

  const goToStage = useCallback(
    (stage, options = {}) => {
      const { autoStart = false } = options;
      setCurrentStage(stage);
      setTimeRemaining(toSeconds(durations[stage]));
      setIsRunning(autoStart);
    },
    [durations]
  );

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const handleStageCompletion = useCallback(() => {
    if (currentStage === "focus") {
      setCompletedFocusSessions((prev) => {
        const next = prev + 1;
        const usesLongBreak = next % LONG_BREAK_INTERVAL === 0;
        const nextStage = usesLongBreak ? "longBreak" : "shortBreak";
        goToStage(nextStage, { autoStart: true });
        return next;
      });
      return;
    }

    goToStage("focus", { autoStart: true });
  }, [currentStage, goToStage]);

  useEffect(() => {
    if (!isRunning || timeRemaining > 0) {
      return;
    }

    handleStageCompletion();
  }, [handleStageCompletion, isRunning, timeRemaining]);

  useEffect(() => {
    if (isRunning) {
      return;
    }

    setTimeRemaining(toSeconds(durations[currentStage]));
  }, [currentStage, durations, isRunning]);

  const handleDurationChange = useCallback((stage, value) => {
    const numeric = Number(value ?? 0);
    if (Number.isNaN(numeric)) {
      return;
    }

    setDurations((prev) => {
      const nextValue = clamp(Math.round(numeric), 1, 90);
      return { ...prev, [stage]: nextValue };
    });
  }, []);

  const handleManualStageChange = useCallback(
    (key) => {
      if (typeof key !== "string") {
        return;
      }

      setIsRunning(false);
      goToStage(key, { autoStart: false });
    },
    [goToStage]
  );

  const handleStartPause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleSkip = useCallback(() => {
    setIsRunning(false);
    handleStageCompletion();
  }, [handleStageCompletion]);

  const handleReset = useCallback(() => {
    setDurations(() =>
      Object.fromEntries(
        STAGE_ORDER.map((stage) => [stage, STAGES[stage].minutes])
      )
    );
    setCompletedFocusSessions(0);
    setCurrentStage("focus");
    setTimeRemaining(toSeconds(STAGES.focus.minutes));
    setIsRunning(false);
  }, []);

  const formattedTime = useMemo(
    () => formatTime(timeRemaining),
    [timeRemaining]
  );

  const totalSeconds = useMemo(
    () => toSeconds(durations[currentStage]),
    [currentStage, durations]
  );

  const progressValue = useMemo(() => {
    if (totalSeconds === 0) {
      return 0;
    }
    return Math.min(100, ((totalSeconds - timeRemaining) / totalSeconds) * 100);
  }, [timeRemaining, totalSeconds]);

  const remainingBeforeLongBreak = useMemo(() => {
    const completedInCycle = completedFocusSessions % LONG_BREAK_INTERVAL;
    return completedInCycle === 0
      ? LONG_BREAK_INTERVAL
      : LONG_BREAK_INTERVAL - completedInCycle;
  }, [completedFocusSessions]);

  const nextStageLabel = useMemo(() => {
    if (currentStage === "focus") {
      const willLongBreak =
        (completedFocusSessions + 1) % LONG_BREAK_INTERVAL === 0;
      return STAGES[willLongBreak ? "longBreak" : "shortBreak"].label;
    }
    return STAGES.focus.label;
  }, [completedFocusSessions, currentStage]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-3xl flex flex-col gap-6 text-black">
        <header className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Pomodoro Pro
          </h1>
          <p className="text-base text-black">
            集中と休憩のリズムをシンプルに管理できるポモドーロタイマーです。
          </p>
        </header>

        <div className="flex flex-col items-center gap-4">
          <Tabs
            aria-label="タイマー種別"
            selectedKey={currentStage}
            onSelectionChange={handleManualStageChange}
            disableAnimation
            classNames={{
              tabList:
                "flex items-center gap-2 rounded-full border-2 border-gray-300 bg-white p-2",
              tab: "rounded-full text-sm font-medium text-black px-6 py-2 data-[selected=true]:bg-black data-[selected=true]:text-white",
              base: "flex flex-col items-center",
            }}
            disableCursorAnimation
          >
            {STAGE_ORDER.map((stage) => (
              <Tab
                key={stage}
                title={STAGES[stage].label}
                className="text-black"
              />
            ))}
          </Tabs>

          <div className="text-7xl font-semibold tracking-widest tabular-nums">
            {formattedTime}
          </div>

          <Progress
            value={progressValue}
            className="w-full max-w-xl"
            color="default"
            classNames={{
              base: "gap-2",
              track: "h-3 rounded-full bg-gray-300 border-2 border-gray-300",
              indicator: "bg-black",
            }}
            aria-label="進行状況"
          />

          <Chip
            className="bg-gray-300 text-black border-2 border-gray-300 rounded-full px-4 py-2"
          >
            次は{nextStageLabel}
          </Chip>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STAGE_ORDER.map((stage) => (
            <Input
              key={stage}
              type="number"
              label={`${STAGES[stage].label} (分)`}
              value={String(durations[stage])}
              onValueChange={(value) => handleDurationChange(stage, value)}
              min={1}
              max={90}
              labelPlacement="outside"
              classNames={{
                label: "text-sm font-medium text-black",
                inputWrapper:
                  "bg-gray-300 border-2 border-gray-300 rounded-md px-4",
                input: "text-lg text-black placeholder:text-black",
              }}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onPress={handleStartPause}
            className="bg-black text-white rounded-full px-8 py-3 font-semibold"
          >
            {isRunning ? "一時停止" : "スタート"}
          </Button>
          <Button
            onPress={handleSkip}
            className="bg-white text-black border-2 border-gray-300 rounded-full px-6 py-3 font-semibold"
          >
            スキップ
          </Button>
          <Button
            onPress={handleReset}
            className="bg-white text-black border-2 border-gray-300 rounded-full px-6 py-3 font-semibold"
          >
            リセット
          </Button>
        </div>

        <footer className="flex flex-col items-center gap-3 text-center">
          <Chip className="bg-gray-300 text-black border-2 border-gray-300 rounded-full px-4 py-2">
            長休憩まであと {remainingBeforeLongBreak} 回の集中
          </Chip>
          <p className="text-sm text-gray-300">
            時間を変更すると現在のモードの残り時間も更新されます。細かな調整でご自身のリズムに合わせてください。
          </p>
        </footer>
      </section>
    </main>
  );
}

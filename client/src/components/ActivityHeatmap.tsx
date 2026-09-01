import { useEffect, useMemo, useState } from "react";
import { getGithubActivity } from "../services/githubService";
import { getLeetcodeActivity } from "../services/leetcodeService";
import {
  getHeatmapCache,
  saveHeatmapCache,
  DailyActivityEntry,
} from "../services/activityService";

interface ActivityHeatmapProps {
  githubUsername?: string;
  leetcodeUsername?: string;
}

interface DailyCount {
  date: string;
  count: number;
}

interface DayBreakdown {
  githubCount: number;
  leetcodeCount: number;
}

interface DaySquare {
  date: string; // "YYYY-MM-DD"
  breakdown: DayBreakdown;
  inCurrentRange: boolean; // false for padding squares before Jan 1 / after Dec 31
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

const totalForDay = (b: DayBreakdown): number => b.githubCount + b.leetcodeCount;

const getIntensityClass = (count: number): string => {
  if (count === 0) return "bg-gray-700";
  if (count <= 2) return "bg-green-900";
  if (count <= 5) return "bg-green-700";
  if (count <= 9) return "bg-green-500";
  return "bg-green-400";
};

const formatDisplayDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

// Builds a tooltip string for one day. Uses \n so the native `title`
// attribute renders it as multiple lines — no extra tooltip UI library
// needed for this.
const buildTooltip = (date: string, breakdown: DayBreakdown): string => {
  const points = totalForDay(breakdown);
  return [
    formatDisplayDate(date),
    `GitHub: ${breakdown.githubCount} commit${breakdown.githubCount === 1 ? "" : "s"}`,
    `LeetCode: ${breakdown.leetcodeCount} submission${breakdown.leetcodeCount === 1 ? "" : "s"}`,
    `Activity Points: ${points}`,
  ].join("\n");
};

// Builds every day of `year` (Jan 1 -> Dec 31), padded at both ends so the
// grid starts on a Sunday and ends on a Saturday.
const buildYearGrid = (
  year: number,
  breakdownMap: Record<string, DayBreakdown>
): DaySquare[] => {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));

  const days: DaySquare[] = [];
  const cursor = new Date(jan1);

  while (cursor.getTime() <= dec31.getTime()) {
    const dateStr = toDateOnly(cursor);
    days.push({
      date: dateStr,
      breakdown: breakdownMap[dateStr] ?? { githubCount: 0, leetcodeCount: 0 },
      inCurrentRange: true,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const paddingBefore = jan1.getUTCDay();
  const paddingAfter = 6 - dec31.getUTCDay();

  const before: DaySquare[] = Array.from({ length: paddingBefore }, (_, i) => ({
    date: `pad-before-${i}`,
    breakdown: { githubCount: 0, leetcodeCount: 0 },
    inCurrentRange: false,
  }));

  const after: DaySquare[] = Array.from({ length: paddingAfter }, (_, i) => ({
    date: `pad-after-${i}`,
    breakdown: { githubCount: 0, leetcodeCount: 0 },
    inCurrentRange: false,
  }));

  return [...before, ...days, ...after];
};

const groupIntoWeeks = (days: DaySquare[]): DaySquare[][] => {
  const weeks: DaySquare[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
};

const getMonthLabelPositions = (weeks: DaySquare[][]): (string | null)[] => {
  const labels: (string | null)[] = new Array(weeks.length).fill(null);
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstRealDay = week.find((d) => d.inCurrentRange);
    if (!firstRealDay) return;

    const month = new Date(firstRealDay.date).getUTCMonth();
    if (month !== lastMonth) {
      labels[weekIndex] = MONTH_LABELS[month];
      lastMonth = month;
    }
  });

  return labels;
};

// Own streak calculation from the merged GitHub+LeetCode daily activity —
// never reads GitHub's or LeetCode's own streak numbers directly.
const calculateStreaks = (breakdownMap: Record<string, DayBreakdown>) => {
  const activeDates = Object.keys(breakdownMap)
    .filter((date) => totalForDay(breakdownMap[date]) > 0)
    .sort();

  if (activeDates.length === 0) {
    return { totalActiveDays: 0, currentStreak: 0, maxStreak: 0 };
  }

  let maxStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < activeDates.length; i++) {
    const prev = new Date(activeDates[i - 1]);
    const curr = new Date(activeDates[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );

    runningStreak = diffDays === 1 ? runningStreak + 1 : 1;
    maxStreak = Math.max(maxStreak, runningStreak);
  }

  const lastActive = activeDates[activeDates.length - 1];
  const today = toDateOnly(new Date());
  const yesterday = toDateOnly(new Date(Date.now() - 24 * 60 * 60 * 1000));

  let currentStreak = 0;
  if (lastActive === today || lastActive === yesterday) {
    currentStreak = 1;
    for (let i = activeDates.length - 1; i > 0; i--) {
      const prev = new Date(activeDates[i - 1]);
      const curr = new Date(activeDates[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    totalActiveDays: activeDates.length,
    currentStreak,
    maxStreak,
  };
};

// Converts the cached array (or freshly merged GitHub+LeetCode data) into
// the {date -> {githubCount, leetcodeCount}} lookup the component renders
// from.
const toBreakdownMap = (
  entries: DailyActivityEntry[]
): Record<string, DayBreakdown> => {
  const map: Record<string, DayBreakdown> = {};
  for (const entry of entries) {
    map[entry.date] = {
      githubCount: entry.githubCount,
      leetcodeCount: entry.leetcodeCount,
    };
  }
  return map;
};

const toEntryArray = (
  breakdownMap: Record<string, DayBreakdown>
): DailyActivityEntry[] =>
  Object.entries(breakdownMap).map(([date, b]) => ({
    date,
    githubCount: b.githubCount,
    leetcodeCount: b.leetcodeCount,
  }));

function ActivityHeatmap({
  githubUsername,
  leetcodeUsername,
}: ActivityHeatmapProps) {
  const [breakdownMap, setBreakdownMap] = useState<Record<string, DayBreakdown>>({});
  // loading = true ONLY while we have nothing at all to show yet (no cache,
  // no fresh data). Once anything is available, the heatmap renders and
  // any further refresh happens silently in the background.
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const availableYears = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFreshAndCache = async () => {
      const merged: Record<string, DayBreakdown> = {};
      const tasks: Promise<void>[] = [];

      if (githubUsername) {
        tasks.push(
          getGithubActivity(githubUsername)
            .then((data) => {
              const dailyCommits: DailyCount[] = data.dailyCommits ?? [];
              for (const entry of dailyCommits) {
                if (!merged[entry.date]) {
                  merged[entry.date] = { githubCount: 0, leetcodeCount: 0 };
                }
                merged[entry.date].githubCount += entry.count;
              }
            })
            .catch((error) => {
              console.error("Heatmap: GitHub data failed:", error);
            })
        );
      }

      if (leetcodeUsername) {
        tasks.push(
          getLeetcodeActivity(leetcodeUsername)
            .then((data) => {
              const dailySubmissions: DailyCount[] = data.dailySubmissions ?? [];
              for (const entry of dailySubmissions) {
                if (!merged[entry.date]) {
                  merged[entry.date] = { githubCount: 0, leetcodeCount: 0 };
                }
                merged[entry.date].leetcodeCount += entry.count;
              }
            })
            .catch((error) => {
              console.error("Heatmap: LeetCode data failed:", error);
            })
        );
      }

      await Promise.allSettled(tasks);

      if (cancelled) return;

      // Only update on-screen state + persist to cache if something was
      // actually fetched (avoids wiping a good cache with an empty result
      // when GitHub/LeetCode both fail, e.g. rate limit).
      if (Object.keys(merged).length > 0) {
        setBreakdownMap(merged);
        saveHeatmapCache(toEntryArray(merged)).catch((error) => {
          console.error("Failed to save heatmap cache:", error);
        });
      }

      setLoading(false);
    };

    const load = async () => {
      if (!githubUsername && !leetcodeUsername) {
        setLoading(false);
        return;
      }

      // Step 1 — try the cache first for an instant render.
      try {
        const cached = await getHeatmapCache();
        if (!cancelled && cached.data && cached.data.length > 0) {
          setBreakdownMap(toBreakdownMap(cached.data));
          setLoading(false); // heatmap can render now
        }
      } catch (error) {
        console.error("Failed to load heatmap cache:", error);
      }

      // Step 2 — always refresh from GitHub/LeetCode in the background
      // (silent if cache already rendered; this also covers the
      // no-cache-yet case, where `loading` is still true until this
      // finishes).
      await loadFreshAndCache();
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [githubUsername, leetcodeUsername]);

  if (!githubUsername && !leetcodeUsername) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-gray-800 p-5 text-gray-400">
        Loading activity...
      </div>
    );
  }

  const { totalActiveDays, currentStreak, maxStreak } =
    calculateStreaks(breakdownMap);

  // Activity Points — display-only score, never added to profile totalXP.
  const totalActivityPoints = Object.values(breakdownMap).reduce(
    (sum, b) => sum + totalForDay(b),
    0
  );

  const yearDays = buildYearGrid(selectedYear, breakdownMap);
  const weeks = groupIntoWeeks(yearDays);
  const monthLabels = getMonthLabelPositions(weeks);

  return (
    <div className="rounded-xl bg-gray-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-white">Coding Activity</p>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-white outline-none"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-300">
        <span>
          Total Active Days: <span className="font-bold text-white">{totalActiveDays}</span>
        </span>
        <span>
          Current Streak: <span className="font-bold text-white">{currentStreak}</span>
        </span>
        <span>
          Max Streak: <span className="font-bold text-white">{maxStreak}</span>
        </span>
        <span>
          Activity Points: <span className="font-bold text-white">{totalActivityPoints}</span>
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="inline-flex flex-col">
          <div className="mb-1 flex gap-1 pl-0">
            {weeks.map((_, weekIndex) => (
              <div
                key={weekIndex}
                className="w-3 flex-shrink-0 text-[10px] text-gray-400"
              >
                {monthLabels[weekIndex] ?? ""}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) =>
                  day.inCurrentRange ? (
                    <div
                      key={day.date}
                      title={buildTooltip(day.date, day.breakdown)}
                      className={`h-3 w-3 flex-shrink-0 rounded-sm ${getIntensityClass(
                        totalForDay(day.breakdown)
                      )}`}
                    />
                  ) : (
                    <div
                      key={`pad-${weekIndex}-${dayIndex}`}
                      className="h-3 w-3 flex-shrink-0"
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-gray-700" />
        <div className="h-3 w-3 rounded-sm bg-green-900" />
        <div className="h-3 w-3 rounded-sm bg-green-700" />
        <div className="h-3 w-3 rounded-sm bg-green-500" />
        <div className="h-3 w-3 rounded-sm bg-green-400" />
        <span>More</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
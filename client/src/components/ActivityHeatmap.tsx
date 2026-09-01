import { useEffect, useMemo, useState } from "react";
import { getGithubActivity } from "../services/githubService";
import { getLeetcodeActivity } from "../services/leetcodeService";

interface ActivityHeatmapProps {
  githubUsername?: string;
  leetcodeUsername?: string;
}

interface DailyCount {
  date: string;
  count: number;
}

interface DaySquare {
  date: string; // "YYYY-MM-DD"
  count: number;
  inCurrentRange: boolean; // false for padding squares before Jan 1 / after Dec 31
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

const getIntensityClass = (count: number): string => {
  if (count === 0) return "bg-gray-700";
  if (count <= 2) return "bg-green-900";
  if (count <= 5) return "bg-green-700";
  if (count <= 9) return "bg-green-500";
  return "bg-green-400";
};

// Builds every day of `year` (Jan 1 -> Dec 31), padded at both ends so the
// grid starts on a Sunday and ends on a Saturday — same layout convention
// GitHub/LeetCode use for their weekly-column grid.
const buildYearGrid = (
  year: number,
  activityMap: Record<string, number>
): DaySquare[] => {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));

  const days: DaySquare[] = [];
  const cursor = new Date(jan1);

  while (cursor.getTime() <= dec31.getTime()) {
    const dateStr = toDateOnly(cursor);
    days.push({
      date: dateStr,
      count: activityMap[dateStr] ?? 0,
      inCurrentRange: true,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const paddingBefore = jan1.getUTCDay(); // 0 = Sunday
  const paddingAfter = 6 - dec31.getUTCDay();

  const before: DaySquare[] = Array.from({ length: paddingBefore }, (_, i) => ({
    date: `pad-before-${i}`,
    count: 0,
    inCurrentRange: false,
  }));

  const after: DaySquare[] = Array.from({ length: paddingAfter }, (_, i) => ({
    date: `pad-after-${i}`,
    count: 0,
    inCurrentRange: false,
  }));

  return [...before, ...days, ...after];
};

// Groups the padded day list into weekly columns of 7 (Sun -> Sat each).
const groupIntoWeeks = (days: DaySquare[]): DaySquare[][] => {
  const weeks: DaySquare[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
};

// For each week column, figure out which month label (if any) should sit
// above it — the label goes on the first week where that month's 1st
// falls, matching GitHub/LeetCode's month-header positioning.
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
// never read from GitHub's or LeetCode's own streak numbers directly.
const calculateStreaks = (activityMap: Record<string, number>) => {
  const activeDates = Object.keys(activityMap)
    .filter((date) => activityMap[date] > 0)
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

    if (diffDays === 1) {
      runningStreak++;
    } else {
      runningStreak = 1;
    }

    maxStreak = Math.max(maxStreak, runningStreak);
  }

  // Current streak: only "alive" if the most recent active day was today
  // or yesterday — otherwise it's broken and should show 0.
  const lastActive = activeDates[activeDates.length - 1];
  const today = toDateOnly(new Date());
  const yesterday = toDateOnly(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

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

function ActivityHeatmap({
  githubUsername,
  leetcodeUsername,
}: ActivityHeatmapProps) {
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Years available in the dropdown. LeetCode's public API only exposes a
  // rolling ~1 year of submissionCalendar data, and GitHub commit dates
  // come from full history — so older years will simply show fewer/no
  // green squares until a backend cache is added later. The dropdown is
  // wired up now so that's a pure backend change later, not a UI rewrite.
  const availableYears = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current - 1, current - 2];
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const merged: Record<string, number> = {};
      const tasks: Promise<void>[] = [];

      if (githubUsername) {
        tasks.push(
          getGithubActivity(githubUsername)
            .then((data) => {
              const dailyCommits: DailyCount[] = data.dailyCommits ?? [];
              for (const entry of dailyCommits) {
                merged[entry.date] = (merged[entry.date] ?? 0) + entry.count;
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
                merged[entry.date] = (merged[entry.date] ?? 0) + entry.count;
              }
            })
            .catch((error) => {
              console.error("Heatmap: LeetCode data failed:", error);
            })
        );
      }

      await Promise.allSettled(tasks);

      if (!cancelled) {
        setActivityMap(merged);
        setLoading(false);
      }
    };

    if (githubUsername || leetcodeUsername) {
      load();
    } else {
      setLoading(false);
    }

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

  // Stats are computed from ALL merged activity (not year-filtered) so
  // "Current Streak" stays correct even if the selected year is a past one.
  const { totalActiveDays, currentStreak, maxStreak } =
    calculateStreaks(activityMap);

  // Activity Points — a display-only score for the heatmap, deliberately
  // NOT added to the profile's totalXP anywhere. Kept as a simple sum of
  // raw daily counts so it never has to touch the XP formula.
  const totalActivityPoints = Object.values(activityMap).reduce(
    (sum, count) => sum + count,
    0
  );

  const yearDays = buildYearGrid(selectedYear, activityMap);
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
          {/* Month labels row */}
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

          {/* Weekly columns grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) =>
                  day.inCurrentRange ? (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} activity`}
                      className={`h-3 w-3 flex-shrink-0 rounded-sm ${getIntensityClass(
                        day.count
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
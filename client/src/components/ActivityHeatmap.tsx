import { useEffect, useState } from "react";
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

// How many days of history to render. Kept smaller than a full year for
// now (simple + fast) — bump this later if you want the full GitHub-style
// 365-day view; nothing else needs to change.
const DAYS_TO_SHOW = 182;

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

const getIntensityClass = (count: number): string => {
  if (count === 0) return "bg-gray-800";
  if (count <= 2) return "bg-green-900";
  if (count <= 5) return "bg-green-700";
  if (count <= 9) return "bg-green-500";
  return "bg-green-400";
};

function ActivityHeatmap({
  githubUsername,
  leetcodeUsername,
}: ActivityHeatmapProps) {
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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

  // Build the last DAYS_TO_SHOW days, oldest first
  const days: DailyCount[] = [];
  const today = new Date();

  for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = toDateOnly(d);
    days.push({ date: dateStr, count: activityMap[dateStr] ?? 0 });
  }

  // Pad the front so the grid starts on a Sunday, matching GitHub's layout
  const firstDay = new Date(days[0].date);
  const paddingCount = firstDay.getUTCDay();
  const paddedDays: (DailyCount | null)[] = [
    ...Array(paddingCount).fill(null),
    ...days,
  ];

  // Group into weeks of 7 (columns)
  const weeks: (DailyCount | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <div className="rounded-xl bg-gray-800 p-5">
      <p className="mb-4 font-semibold text-white">Coding Activity</p>

      <div className="flex gap-1 overflow-x-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) =>
              day ? (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} activity`}
                  className={`h-3 w-3 rounded-sm ${getIntensityClass(day.count)}`}
                />
              ) : (
                <div key={`pad-${weekIndex}-${dayIndex}`} className="h-3 w-3" />
              )
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-gray-800" />
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
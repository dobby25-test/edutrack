import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../../services/api';
import authService from '../../services/authService';
import { applyTheme, getInitialTheme, THEME_CHANGE_EVENT } from '../../utils/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const emptyAnalytics = {
  stats: {
    totalAssignments: 0,
    completedAssignments: 0,
    averageScore: 0,
    totalBadges: 0
  },
  charts: {
    performanceOverTime: [],
    subjectPerformance: [],
    submissionPatterns: { onTime: 0, late: 0, pending: 0 },
    gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
  },
  insights: {
    strengths: [],
    weaknesses: [],
    onTimeRate: 0
  }
};

export default function StudentAnalytics({ onClose }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(emptyAnalytics);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'eduTheme' && event.newValue) {
        setTheme(event.newValue === 'light' ? 'light' : 'dark');
      }
    };
    const onTheme = (event) => {
      const next = event?.detail?.theme;
      if (next === 'light' || next === 'dark') setTheme(next);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(THEME_CHANGE_EVENT, onTheme);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, onTheme);
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const user = authService.getCurrentUser();
        if (!user?.id) {
          setError('Unable to load student context.');
          setAnalytics(emptyAnalytics);
          return;
        }
        const res = await api.get(`/analytics/student/${user.id}`);
        setAnalytics({
          ...emptyAnalytics,
          ...(res?.data || {}),
          stats: { ...emptyAnalytics.stats, ...(res?.data?.stats || {}) },
          charts: { ...emptyAnalytics.charts, ...(res?.data?.charts || {}) },
          insights: { ...emptyAnalytics.insights, ...(res?.data?.insights || {}) }
        });
      } catch (fetchError) {
        console.error('Failed to fetch analytics:', fetchError);
        setError('Failed to load analytics.');
        setAnalytics(emptyAnalytics);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: theme === 'dark' ? '#d7e5fb' : '#334155'
          }
        }
      },
      scales: {
        y: {
          ticks: { color: theme === 'dark' ? '#9fb0c8' : '#64748b' },
          grid: { color: theme === 'dark' ? 'rgba(159,176,200,0.16)' : 'rgba(100,116,139,0.16)' }
        },
        x: {
          ticks: { color: theme === 'dark' ? '#9fb0c8' : '#64748b' },
          grid: { color: theme === 'dark' ? 'rgba(159,176,200,0.16)' : 'rgba(100,116,139,0.16)' }
        }
      }
    }),
    [theme]
  );

  const perfData = {
    labels: analytics.charts.performanceOverTime.map((row) =>
      new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Score %',
        data: analytics.charts.performanceOverTime.map((row) => row.score),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.18)',
        fill: true,
        tension: 0.36
      }
    ]
  };

  const subjectData = {
    labels: analytics.charts.subjectPerformance.map((row) => row.subject),
    datasets: [
      {
        label: 'Average %',
        data: analytics.charts.subjectPerformance.map((row) => row.average),
        backgroundColor: ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'],
        borderRadius: 7
      }
    ]
  };

  const submissionData = {
    labels: ['On Time', 'Late', 'Pending'],
    datasets: [
      {
        data: [
          analytics.charts.submissionPatterns.onTime,
          analytics.charts.submissionPatterns.late,
          analytics.charts.submissionPatterns.pending
        ],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
      }
    ]
  };

  const gradeData = {
    labels: ['A', 'B', 'C', 'D', 'F'],
    datasets: [
      {
        label: 'Count',
        data: [
          analytics.charts.gradeDistribution.A,
          analytics.charts.gradeDistribution.B,
          analytics.charts.gradeDistribution.C,
          analytics.charts.gradeDistribution.D,
          analytics.charts.gradeDistribution.F
        ],
        backgroundColor: ['#22c55e', '#3b82f6', '#06b6d4', '#f59e0b', '#ef4444'],
        borderRadius: 7
      }
    ]
  };

  return (
    <>
      <style>{css}</style>
      <div className={`sa-page ${theme}`}>
        <header className="sa-header">
          <button type="button" className="sa-back" onClick={onClose}>
            Back
          </button>
          <div>
            <h1>Student Analytics</h1>
            <p>Progress, submission behavior, and subject performance insights.</p>
          </div>
        </header>

        {loading ? <p className="sa-state">Loading analytics...</p> : null}
        {!loading && error ? <p className="sa-state error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <section className="sa-kpis">
              <article>
                <strong>{analytics.stats.totalAssignments}</strong>
                <span>Total Assignments</span>
              </article>
              <article>
                <strong>{analytics.stats.completedAssignments}</strong>
                <span>Completed</span>
              </article>
              <article>
                <strong>{analytics.stats.averageScore}%</strong>
                <span>Average Score</span>
              </article>
              <article>
                <strong>{analytics.stats.totalBadges}</strong>
                <span>Badges</span>
              </article>
            </section>

            <section className="sa-insights">
              <article>
                <h3>Strengths</h3>
                <p>{analytics.insights.strengths.join(', ') || 'Build consistency and keep momentum.'}</p>
              </article>
              <article>
                <h3>Focus Areas</h3>
                <p>{analytics.insights.weaknesses.join(', ') || 'No weak areas identified yet.'}</p>
              </article>
              <article>
                <h3>On-Time Rate</h3>
                <p>{analytics.insights.onTimeRate}% on-time submissions.</p>
              </article>
            </section>

            <section className="sa-grid">
              <article className="sa-chart full">
                <h3>Performance Trend</h3>
                <div className="sa-canvas">
                  <Line data={perfData} options={chartOptions} />
                </div>
              </article>
              <article className="sa-chart">
                <h3>Subject Performance</h3>
                <div className="sa-canvas">
                  <Bar data={subjectData} options={chartOptions} />
                </div>
              </article>
              <article className="sa-chart">
                <h3>Submission Pattern</h3>
                <div className="sa-canvas">
                  <Doughnut data={submissionData} options={{ ...chartOptions, scales: undefined }} />
                </div>
              </article>
              <article className="sa-chart full">
                <h3>Grade Distribution</h3>
                <div className="sa-canvas">
                  <Bar data={gradeData} options={chartOptions} />
                </div>
              </article>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}

const css = `
  .sa-page {
    --bg1: #070d18;
    --bg2: #10192d;
    --panel: rgba(16, 25, 43, 0.82);
    --panel-soft: rgba(23, 35, 58, 0.86);
    --text: #eaf2ff;
    --muted: #9fb0c8;
    --border: rgba(99, 179, 255, 0.2);
    min-height: 100vh;
    padding: 22px;
    color: var(--text);
    background:
      radial-gradient(circle at 7% 0%, rgba(94, 114, 235, 0.25), transparent 36%),
      radial-gradient(circle at 90% 8%, rgba(99, 179, 255, 0.18), transparent 40%),
      linear-gradient(160deg, var(--bg1), var(--bg2));
    font-family: "IBM Plex Sans", sans-serif;
  }
  .sa-page.light {
    --panel: rgba(255, 255, 255, 0.94);
    --panel-soft: rgba(246, 251, 255, 0.98);
    --text: #0f172a;
    --muted: #546579;
    --border: rgba(37, 99, 235, 0.16);
    background:
      radial-gradient(circle at 7% 0%, rgba(191, 219, 254, 0.45), transparent 38%),
      radial-gradient(circle at 90% 8%, rgba(167, 243, 208, 0.32), transparent 40%),
      linear-gradient(165deg, #eef4ff, #f8fbff);
  }
  .sa-header {
    max-width: 1180px;
    margin: 0 auto 14px;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: 12px;
  }
  .sa-back {
    border: 1px solid var(--border);
    background: var(--panel);
    color: var(--text);
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 700;
  }
  .sa-header h1 {
    margin: 0;
    font-size: clamp(24px, 3vw, 34px);
  }
  .sa-header p {
    margin: 6px 0 0;
    color: var(--muted);
    font-size: 13px;
  }
  .sa-state {
    max-width: 1180px;
    margin: 0 auto;
    border: 1px solid var(--border);
    background: var(--panel);
    border-radius: 12px;
    padding: 14px;
    color: var(--muted);
  }
  .sa-state.error {
    color: #ef4444;
  }
  .sa-kpis {
    max-width: 1180px;
    margin: 0 auto 12px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .sa-kpis article {
    border: 1px solid var(--border);
    background: var(--panel);
    border-radius: 14px;
    padding: 14px;
    animation: saFade 0.3s ease;
  }
  .sa-kpis strong {
    font-size: 28px;
    display: block;
  }
  .sa-kpis span {
    color: var(--muted);
    font-size: 12px;
  }
  .sa-insights {
    max-width: 1180px;
    margin: 0 auto 12px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .sa-insights article {
    border: 1px solid var(--border);
    background: var(--panel-soft);
    border-radius: 14px;
    padding: 14px;
    animation: saFade 0.3s ease;
  }
  .sa-insights h3 {
    margin: 0 0 8px;
    font-size: 14px;
  }
  .sa-insights p {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.5;
  }
  .sa-grid {
    max-width: 1180px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .sa-chart {
    border: 1px solid var(--border);
    background: var(--panel);
    border-radius: 14px;
    padding: 14px;
    animation: saFade 0.35s ease;
  }
  .sa-chart.full {
    grid-column: 1 / -1;
  }
  .sa-chart h3 {
    margin: 0 0 10px;
    font-size: 15px;
  }
  .sa-canvas {
    height: 300px;
  }
  @keyframes saFade {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (max-width: 980px) {
    .sa-kpis {
      grid-template-columns: 1fr 1fr;
    }
    .sa-insights,
    .sa-grid {
      grid-template-columns: 1fr;
    }
    .sa-chart.full {
      grid-column: auto;
    }
  }
  @media (max-width: 760px) {
    .sa-page {
      padding: 14px;
    }
    .sa-kpis {
      grid-template-columns: 1fr;
    }
  }
`;

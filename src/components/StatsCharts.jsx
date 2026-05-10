import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJs.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

export default function StatsCharts({ topics, stats }) {
  const correctCounts = topics.map((topic) => stats?.[topic]?.correct ?? 0);
  const wrongCounts = topics.map((topic) => stats?.[topic]?.wrong ?? 0);

  const accuracyValues = topics.map((topic) => {
    const correct = stats?.[topic]?.correct ?? 0;
    const wrong = stats?.[topic]?.wrong ?? 0;
    const total = correct + wrong;

    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  });

  const totalCorrect = correctCounts.reduce((sum, value) => sum + value, 0);
  const totalWrong = wrongCounts.reduce((sum, value) => sum + value, 0);

  const titleStyle = {
    color: "#ffffff",
    font: {
      size: 16,
      weight: "bold",
    },
    padding: {
      bottom: 14,
    },
  };

  const legendStyle = {
    labels: {
      color: "#e5e7eb",
      font: {
        size: 12,
      },
    },
  };

  const gridStyle = {
    color: "rgba(255,255,255,0.08)",
  };

  const tickStyle = {
    color: "#cbd5e1",
    font: {
      size: 12,
    },
  };

  const accuracyChartData = {
    labels: topics,
    datasets: [
      {
        label: "Pontosság (%)",
        data: accuracyValues,
        backgroundColor: [
          "rgba(34, 197, 94, 0.78)",
          "rgba(250, 204, 21, 0.78)",
          "rgba(245, 158, 11, 0.78)",
          "rgba(59, 130, 246, 0.78)",
          "rgba(168, 85, 247, 0.78)",
        ],
        borderRadius: 10,
      },
    ],
  };

  const accuracyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Témánkénti pontosság",
        ...titleStyle,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "rgba(250, 204, 21, 0.25)",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            return `${context.raw}%`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: tickStyle,
        grid: gridStyle,
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          ...tickStyle,
          callback: function (value) {
            return value + "%";
          },
        },
        grid: gridStyle,
      },
    },
  };

  const answerChartData = {
    labels: topics,
    datasets: [
      {
        label: "Helyes",
        data: correctCounts,
        backgroundColor: "rgba(34, 197, 94, 0.85)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
        borderRadius: 8,
      },
      {
        label: "Hibás",
        data: wrongCounts,
        backgroundColor: "rgba(249, 115, 22, 0.85)",
        borderColor: "rgba(249, 115, 22, 1)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const answerChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendStyle,
      title: {
        display: true,
        text: "Helyes és hibás válaszok",
        ...titleStyle,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "rgba(250, 204, 21, 0.25)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: tickStyle,
        grid: gridStyle,
      },
      y: {
        beginAtZero: true,
        ticks: {
          ...tickStyle,
          precision: 0,
        },
        grid: gridStyle,
      },
    },
  };

  const totalResultChartData = {
    labels: ["Helyes", "Hibás"],
    datasets: [
      {
        data: [totalCorrect, totalWrong],
        backgroundColor: [
          "rgba(34, 197, 94, 0.9)",
          "rgba(249, 115, 22, 0.9)",
        ],
        borderColor: [
          "rgba(255,255,255,0.08)",
          "rgba(255,255,255,0.08)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const totalResultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: legendStyle,
      title: {
        display: true,
        text: "Összesített eredmény",
        ...titleStyle,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "rgba(250, 204, 21, 0.25)",
        borderWidth: 1,
      },
    },
    cutout: "62%",
  };

  return (
    <div className="charts-section">
      <div className="chart-card wide-card">
        <div className="chart-inner">
          <Bar data={accuracyChartData} options={accuracyChartOptions} />
        </div>
      </div>

      <div className="chart-card wide-card">
        <div className="chart-inner">
          <Bar data={answerChartData} options={answerChartOptions} />
        </div>
      </div>

      <div className="chart-card doughnut-card">
        <div className="chart-inner doughnut-inner">
          <Doughnut
            data={totalResultChartData}
            options={totalResultChartOptions}
          />
        </div>
      </div>
    </div>
  );
}
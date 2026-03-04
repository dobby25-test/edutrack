function StatsCards({ stats }) {
  const cards = [
    { title: 'Total Projects', value: stats?.totalProjects || 0, icon: 'P' },
    { title: 'Total Students', value: stats?.totalStudents || 0, icon: 'S' },
    { title: 'Pending Reviews', value: stats?.pendingReviews || 0, icon: 'R' },
    { title: 'Graded', value: stats?.graded || 0, icon: 'G' }
  ];

  return (
    <div className="td-metrics">
      {cards.map((card, index) => (
        <div key={index} className="td-metric">
          <div>
            <p className="td-metric-label">{card.title}</p>
            <p className="td-metric-value">{card.value}</p>
          </div>
          <div className="td-icon">{card.icon}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;

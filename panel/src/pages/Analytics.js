import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');

  const [summary, setSummary] = useState(null);
  const [memberData, setMemberData] = useState([]);
  const [messageData, setMessageData] = useState([]);
  const [activityData, setActivityData] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics/${id}/summary`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      setError('Error fetching summary: ' + error.message);
    }
  }, [id, navigate]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics in parallel
      const [membersRes, messagesRes, activityRes] = await Promise.all([
        fetch(`/api/analytics/${id}/members?days=${timeRange}`, { credentials: 'include' }),
        fetch(`/api/analytics/${id}/messages?days=${timeRange}`, { credentials: 'include' }),
        fetch(`/api/analytics/${id}/activity?days=${timeRange}`, { credentials: 'include' })
      ]);

      if (!membersRes.ok || !messagesRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const [membersData, messagesDataRes, activityDataRes] = await Promise.all([
        membersRes.json(),
        messagesRes.json(),
        activityRes.json()
      ]);

      setMemberData(membersData.analytics);
      setMessageData(messagesDataRes.analytics);
      setActivityData(activityDataRes);
    } catch (error) {
      setError('Error fetching analytics: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [id, timeRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !summary) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page analytics-page">
      <div className="analytics-header">
        <h1>Server Analytics</h1>
        {summary && <h2>{summary.serverName}</h2>}
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Members</h3>
              <p className="stat-value">{summary.memberCount}</p>
              {summary.yesterdayComparison.members !== 0 && (
                <span className={summary.yesterdayComparison.members > 0 ? 'stat-positive' : 'stat-negative'}>
                  {summary.yesterdayComparison.members > 0 ? '+' : ''}{summary.yesterdayComparison.members} vs yesterday
                </span>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🟢</div>
            <div className="stat-info">
              <h3>Online Members</h3>
              <p className="stat-value">{summary.onlineCount}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-info">
              <h3>Messages Today</h3>
              <p className="stat-value">{summary.todayMessages}</p>
              {summary.yesterdayComparison.messages !== 0 && (
                <span className={summary.yesterdayComparison.messages > 0 ? 'stat-positive' : 'stat-negative'}>
                  {summary.yesterdayComparison.messages > 0 ? '+' : ''}{summary.yesterdayComparison.messages} vs yesterday
                </span>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Channels</h3>
              <p className="stat-value">{summary.channelCount}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">➕</div>
            <div className="stat-info">
              <h3>Joins Today</h3>
              <p className="stat-value">{summary.todayJoins}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">➖</div>
            <div className="stat-info">
              <h3>Leaves Today</h3>
              <p className="stat-value">{summary.todayLeaves}</p>
            </div>
          </div>
        </div>
      )}

      <div className="time-range-selector">
        <label>Time Range:</label>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Member Growth Chart */}
          <div className="chart-section">
            <h3>Member Growth</h3>
            <div className="simple-chart">
              {memberData.length > 0 ? (
                <div className="bar-chart">
                  {memberData.map((day, index) => (
                    <div key={index} className="bar-item">
                      <div className="bar-label">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="bar-container">
                        <div
                          className="bar"
                          style={{
                            height: `${(day.memberCount / Math.max(...memberData.map(d => d.memberCount))) * 100}%`,
                            backgroundColor: '#bb86fc'
                          }}
                          title={`${day.memberCount} members`}
                        ></div>
                      </div>
                      <div className="bar-value">{day.memberCount}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No member data available</p>
              )}
            </div>
          </div>

          {/* Message Activity Chart */}
          <div className="chart-section">
            <h3>Message Activity</h3>
            <div className="simple-chart">
              {messageData.length > 0 ? (
                <div className="bar-chart">
                  {messageData.map((day, index) => (
                    <div key={index} className="bar-item">
                      <div className="bar-label">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="bar-container">
                        <div
                          className="bar"
                          style={{
                            height: `${(day.messagesCount / Math.max(...messageData.map(d => d.messagesCount))) * 100}%`,
                            backgroundColor: '#50fa7b'
                          }}
                          title={`${day.messagesCount} messages`}
                        ></div>
                      </div>
                      <div className="bar-value">{day.messagesCount}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No message data available</p>
              )}
            </div>
          </div>

          {/* Top Active Users */}
          {activityData && activityData.topUsers && activityData.topUsers.length > 0 && (
            <div className="chart-section">
              <h3>Most Active Users</h3>
              <div className="users-list">
                {activityData.topUsers.map((user, index) => (
                  <div key={user.id} className="user-item">
                    <span className="user-rank">#{index + 1}</span>
                    {user.avatar && <img src={user.avatar} alt={user.username} className="user-avatar" />}
                    <span className="user-name">{user.username}</span>
                    <span className="user-stat">{user.activeDays} active days</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Summary */}
          {activityData && (
            <div className="chart-section">
              <h3>Activity Summary ({timeRange} days)</h3>
              <div className="activity-summary">
                <div className="summary-item">
                  <strong>Total Joins:</strong> <span>{activityData.totalJoins}</span>
                </div>
                <div className="summary-item">
                  <strong>Total Leaves:</strong> <span>{activityData.totalLeaves}</span>
                </div>
                <div className="summary-item">
                  <strong>Net Growth:</strong>
                  <span className={activityData.netGrowth >= 0 ? 'stat-positive' : 'stat-negative'}>
                    {activityData.netGrowth >= 0 ? '+' : ''}{activityData.netGrowth}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Analytics;

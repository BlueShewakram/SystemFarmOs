import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Truck, ShieldCheck, Bell, AlertCircle, SignalHigh } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './FarmMonitoringPage.css'

const FarmMonitoringPage = () => {
  const [stats, setStats] = useState({
    totalLivestock: 0,
    availableResources: 0,
    recentActivities: 0,
    activeAlerts: 0,
  })
  const [activities, setActivities] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchTableCount = useCallback(async (table) => {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) throw error
      return count || 0
    } catch {
      return null
    }
  }, [])

  const fetchRecentItems = useCallback(async (table, columns = '*', limit = 5, orderBy = 'created_at') => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .order(orderBy, { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch {
      return []
    }
  }, [])

  const refreshFarmData = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const totalLivestock = await fetchTableCount('livestock')
    const availableResources = await fetchTableCount('inventory')
    const recentActivities = await fetchTableCount('activity_logs')
    const activeAlerts = await fetchTableCount('alerts')

    const activityRows = await fetchRecentItems('activity_logs', 'id, description, created_at', 6, 'created_at')
    const alertRows = await fetchRecentItems('alerts', 'id, message, created_at, severity', 5, 'created_at')

    setStats({
      totalLivestock: totalLivestock ?? 18,
      availableResources: availableResources ?? 32,
      recentActivities: recentActivities ?? activityRows.length,
      activeAlerts: activeAlerts ?? alertRows.length,
    })

    setActivities(activityRows.length ? activityRows : [
      { id: 'fallback-1', description: 'Irrigation pump turned on in Zone 3', created_at: new Date().toISOString() },
      { id: 'fallback-2', description: 'Inventory stock checked for fertilizers', created_at: new Date().toISOString() },
      { id: 'fallback-3', description: 'Livestock health monitor report completed', created_at: new Date().toISOString() },
    ])

    setAlerts(alertRows.length ? alertRows : [
      { id: 'fallback-a', message: 'Low soil moisture detected in Field 2', severity: 'warning', created_at: new Date().toISOString() },
      { id: 'fallback-b', message: 'Temperature spike in greenhouse 1', severity: 'critical', created_at: new Date().toISOString() },
    ])

    if ([totalLivestock, availableResources, recentActivities, activeAlerts].some((value) => value === null)) {
      setErrorMessage('Some monitoring tables are unavailable, so fallback data is being shown.')
    }

    setLoading(false)
  }, [fetchRecentItems, fetchTableCount])

  useEffect(() => {
    const timer = window.setTimeout(refreshFarmData, 0)
    const interval = window.setInterval(refreshFarmData, 15000)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
    }
  }, [refreshFarmData])

  const metrics = useMemo(() => [
    {
      label: 'Total Livestock',
      value: loading ? 'Loading...' : stats.totalLivestock,
      icon: <Truck size={20} className="metric-icon" />,
      description: 'All animals currently tracked on the farm.',
    },
    {
      label: 'Available Resources',
      value: loading ? 'Loading...' : stats.availableResources,
      icon: <ShieldCheck size={20} className="metric-icon" />,
      description: 'Supplies, equipment and materials ready for use.',
    },
    {
      label: 'Recent Activities',
      value: loading ? 'Loading...' : stats.recentActivities,
      icon: <Activity size={20} className="metric-icon" />,
      description: 'Latest farm operations and system updates.',
    },
    {
      label: 'Active Alerts',
      value: loading ? 'Loading...' : stats.activeAlerts,
      icon: <Bell size={20} className="metric-icon" />,
      description: 'Current warnings and notifications from the farm.',
    },
  ], [loading, stats])

  return (
    <div className="farm-monitoring-page fade-up">
      <div className="farm-monitoring-header">
        <div>
          <p className="eyebrow">Farm Monitoring</p>
          <h2>Centralized Farm Operations</h2>
          <p className="page-copy">
            Monitor livestock, inventory, activities, and alerts in one place.
            Data refreshes automatically every 15 seconds.
          </p>
        </div>
        <div className="status-chip">
          <SignalHigh size={18} />
          <span>{loading ? 'Refreshing data...' : 'Live farm status'}</span>
        </div>
      </div>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <div className="farm-metrics-grid">
        {metrics.map((metric) => (
          <section key={metric.label} className="farm-metric-card">
            <div className="metric-top">
              {metric.icon}
              <strong>{metric.value}</strong>
            </div>
            <div>
              <p className="metric-label">{metric.label}</p>
              <p className="metric-text">{metric.description}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="farm-detail-grid">
        <div className="farm-panel">
          <h3>Latest Activities</h3>
          <div className="activity-list">
            {activities.map((activity) => (
              <article key={activity.id} className="activity-item">
                <div>
                  <strong>{activity.description}</strong>
                  <p>{new Date(activity.created_at).toLocaleString()}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="farm-panel">
          <h3>Active Alerts</h3>
          <div className="alert-list">
            {alerts.map((alert) => (
              <article key={alert.id} className="alert-item">
                <div className="alert-icon">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <strong>{alert.message}</strong>
                  <p>{new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmMonitoringPage

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Droplets, CloudRain, Sun, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './IrrigationPage.css';

const IrrigationPage = () => {
  const { searchQuery } = useOutletContext() || { searchQuery: '' };
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const pendingDeleteRef = useRef(new Map());

  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('irrigation_control')
        .select('*')
        .order('irrigation_id', { ascending: true });
      if (error) throw error;
      const pendingIds = pendingDeleteRef.current;
      const filtered = (data || []).filter((zone) => !pendingIds.has(zone.irrigation_id));
      setControls(filtered);
    } catch (err) {
      console.error('Failed to fetch irrigation controls:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      pendingDeleteRef.current.forEach(({ timeoutId }) => {
        window.clearTimeout(timeoutId);
      });
      pendingDeleteRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('irrigation-control-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'irrigation_control' },
        (payload) => {
          const pendingIds = pendingDeleteRef.current;

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.irrigation_id;
            if (!deletedId) return;
            setControls((current) => current.filter((zone) => zone.irrigation_id !== deletedId));
            return;
          }

          const nextRow = payload.new;
          if (!nextRow) return;
          if (pendingIds.has(nextRow.irrigation_id)) return;

          setControls((current) => {
            const exists = current.some((zone) => zone.irrigation_id === nextRow.irrigation_id);
            if (exists) {
              return current.map((zone) =>
                zone.irrigation_id === nextRow.irrigation_id
                  ? { ...zone, ...nextRow }
                  : zone
              );
            }
            const nextList = [...current, nextRow];
            return nextList.sort((a, b) => a.irrigation_id - b.irrigation_id);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const autoUpdateWeather = useCallback(async (condition) => {
    try {
      const newStatus = condition === 'Rainy' ? 'Off' : 'On';
      const nextTimestamp = new Date().toISOString();
      
      const { data, error: currentWeatherError } = await supabase
        .from('irrigation_control')
        .select('weather_condition')
        .limit(1);
      if (currentWeatherError) throw currentWeatherError;
      if (data?.[0]?.weather_condition === condition) return;

      const { error } = await supabase
        .from('irrigation_control')
        .update({ 
          weather_condition: condition, 
          irrigation_status: newStatus,
          last_updated: nextTimestamp
        })
        .neq('irrigation_id', 0);

      if (error) throw error;

      setControls((current) => current.map((zone) => ({
        ...zone,
        weather_condition: condition,
        irrigation_status: newStatus,
        last_updated: nextTimestamp
      })));
      
      await supabase.from('system_logs').insert([{
        action_type: 'Auto-Irrigation',
        details: `Weather changed to ${condition}. System automatically turned ${newStatus}.`
      }]);

      await supabase.from('notifications').insert([{
        message: `Weather changed to ${condition}. Irrigation automatically turned ${newStatus}.`,
        type: 'Irrigation',
        status: 'Pending'
      }]);
    } catch (err) {
      console.error('Auto-update failed:', err.message);
    }
  }, [fetchControls]);

  useEffect(() => {
    const timer = window.setTimeout(fetchControls, 0);
    
    const interval = setInterval(() => {
      const conditions = ['Sunny', 'Rainy', 'Cloudy'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      autoUpdateWeather(randomCondition);
    }, 15000);

    return () => {
      window.clearTimeout(timer);
      clearInterval(interval);
    };
  }, [autoUpdateWeather, fetchControls]);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'On' ? 'Off' : 'On';
    const nextTimestamp = new Date().toISOString();
    setControls((current) => current.map((zone) => (
      zone.irrigation_id === id
        ? { ...zone, irrigation_status: newStatus, last_updated: nextTimestamp }
        : zone
    )));
    try {
      const { error } = await supabase
        .from('irrigation_control')
        .update({ irrigation_status: newStatus, last_updated: nextTimestamp })
        .eq('irrigation_id', id);
      if (error) throw error;

      await supabase.from('notifications').insert([{
        message: `Irrigation Zone #${id} has been turned ${newStatus} manually.`,
        type: 'Irrigation',
        status: 'Pending'
      }]);
    } catch (err) {
      console.error('Failed to update irrigation status:', err.message);
      await fetchControls();
      alert('Failed to update status: ' + err.message);
    }
  };

  const finalizeZoneRemoval = useCallback(async (id) => {
    const pending = pendingDeleteRef.current.get(id);
    if (!pending) return;

    pendingDeleteRef.current.delete(id);
    setPendingDeletes((current) => current.filter((zone) => zone.irrigation_id !== id));

    try {
      const { error } = await supabase
        .from('irrigation_control')
        .delete()
        .eq('irrigation_id', id);
      if (error) throw error;

      await supabase.from('system_logs').insert([{
        action_type: 'Irrigation Zone Removed',
        details: `Irrigation Zone #${id} was removed.`
      }]);

      await supabase.from('notifications').insert([{
        message: `Irrigation Zone #${id} has been removed.`,
        type: 'Irrigation',
        status: 'Pending'
      }]);
    } catch (err) {
      console.error('Failed to remove irrigation zone:', err.message);
      setControls((current) => {
        const restored = [...current, pending.zone];
        return restored.sort((a, b) => a.irrigation_id - b.irrigation_id);
      });
      alert('Failed to remove zone: ' + err.message);
    }
  }, []);

  const removeZone = (zone, displayNumber) => {
    const id = zone.irrigation_id;
    if (pendingDeleteRef.current.has(id)) return;

    setControls((current) => current.filter((item) => item.irrigation_id !== id));
    setPendingDeletes((current) => [...current, { ...zone, displayNumber }]);

    const timeoutId = window.setTimeout(() => {
      finalizeZoneRemoval(id);
    }, 4500);

    pendingDeleteRef.current.set(id, { zone: { ...zone, displayNumber }, timeoutId });
  };

  const undoRemove = (id) => {
    const pending = pendingDeleteRef.current.get(id);
    if (!pending) return;

    window.clearTimeout(pending.timeoutId);
    pendingDeleteRef.current.delete(id);
    setPendingDeletes((current) => current.filter((zone) => zone.irrigation_id !== id));
    setControls((current) => {
      const restored = [...current, pending.zone];
      return restored.sort((a, b) => a.irrigation_id - b.irrigation_id);
    });
  };

  const addSimulatedZone = async () => {
    try {
      const { error } = await supabase
        .from('irrigation_control')
        .insert([{ weather_condition: 'Sunny', irrigation_status: 'On' }]);
      if (error) throw error;
      await fetchControls();
    } catch (err) {
      console.error('Failed to add irrigation zone:', err.message);
      alert('Failed to add zone: ' + err.message);
    }
  };

  const simulateWeather = async (condition) => {
    try {
      setLoading(true);
      const newStatus = condition === 'Rainy' ? 'Off' : 'On';
      const nextTimestamp = new Date().toISOString();
      
      const { error } = await supabase
        .from('irrigation_control')
        .update({ 
          weather_condition: condition, 
          irrigation_status: newStatus,
          last_updated: nextTimestamp
        })
        .neq('irrigation_id', 0);

      if (error) throw error;
      setControls((current) => current.map((zone) => ({
        ...zone,
        weather_condition: condition,
        irrigation_status: newStatus,
        last_updated: nextTimestamp
      })));

      await supabase.from('notifications').insert([{
        message: `Weather simulated to ${condition}. Irrigation automatically turned ${newStatus}.`,
        type: 'Irrigation',
        status: 'Pending'
      }]);

      alert(`Weather changed to ${condition}. System automatically turned ${newStatus}.`);
    } catch (err) {
      console.error('Failed to simulate weather:', err.message);
      alert('Failed to simulate weather: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (value) => {
    if (!value) return 'Not updated';
    return new Date(value).toLocaleTimeString();
  };

  const queryTokens = useMemo(() => {
    if (!searchQuery) return [];
    return searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  }, [searchQuery]);

  const displayOrderMap = useMemo(() => {
    const map = new Map();
    controls.forEach((zone, index) => {
      map.set(zone.irrigation_id, index + 1);
    });
    return map;
  }, [controls]);

  const filteredControls = useMemo(() => {
    if (queryTokens.length === 0) return controls;

    return controls.filter((zone) => {
      const zoneIdText = String(zone.irrigation_id);
      const displayNumber = displayOrderMap.get(zone.irrigation_id);
      const displayLabel = displayNumber ? `Zone ${displayNumber}` : '';
      const displayHash = displayNumber ? `#${displayNumber}` : '';
      const searchText = [
        displayLabel,
        displayHash,
        `Zone ${zone.irrigation_id}`,
        `#${zone.irrigation_id}`,
        zone.weather_condition,
        zone.irrigation_status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return queryTokens.every((token) => {
        if (/^\d+$/.test(token)) {
          const matchesDisplay = displayNumber ? String(displayNumber) === token : false;
          return matchesDisplay || zoneIdText.includes(token);
        }
        return searchText.includes(token);
      });
    });
  }, [controls, displayOrderMap, queryTokens]);

  const trimmedQuery = searchQuery?.trim();
  const showNoZones = !loading && controls.length === 0;
  const showNoMatches = !loading && controls.length > 0 && filteredControls.length === 0 && queryTokens.length > 0;

  return (
    <div className="irrigation-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Smart Irrigation Control</h2>
          <p>Monitor and manually override AI-driven irrigation zones.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="weather-toggle">
            <button className="weather-btn weather-btn-sunny" onClick={() => simulateWeather('Sunny')}>Sunny</button>
            <button className="weather-btn weather-btn-rainy" onClick={() => simulateWeather('Rainy')}>Rainy</button>
            <button className="weather-btn weather-btn-cloudy" onClick={() => simulateWeather('Cloudy')}>Cloudy</button>
          </div>
          <button className="btn btn-outline" onClick={addSimulatedZone}>Add Zone</button>
          <button className="btn btn-primary" onClick={fetchControls}><RefreshCw size={18} /> Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>
      ) : (
        <div className="irrigation-grid">
          {filteredControls.length === 0 ? (
            <div className="col-span-full text-center p-12 text-secondary bg-[rgba(15,23,42,0.4)] rounded-2xl border border-white/5">
              {showNoZones ? 'No irrigation zones found.' : `No results for "${trimmedQuery}".`}
            </div>
          ) : (
            filteredControls.map((zone) => {
              const displayNumber = displayOrderMap.get(zone.irrigation_id) ?? zone.irrigation_id;

              return (
              <div key={zone.irrigation_id} className={`irrigation-card ${zone.irrigation_status === 'On' ? 'is-active' : ''} weather-${zone.weather_condition.toLowerCase()}`}>
                <button
                  className="irrigation-remove-icon"
                  onClick={() => removeZone(zone, displayNumber)}
                  type="button"
                  aria-label={`Remove zone ${displayNumber}`}
                  title="Remove zone"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="ic-header">
                  <div className="ic-icon-wrapper">
                    {zone.weather_condition === 'Rainy' ? <CloudRain size={24} /> : zone.weather_condition === 'Sunny' ? <Sun size={24} /> : <Droplets size={24} />}
                    <div className="ic-glow"></div>
                  </div>
                  <div className="ic-title">
                    <h3>Zone #{displayNumber}</h3>
                    <span className="ic-weather-badge">{zone.weather_condition}</span>
                  </div>
                </div>

                <div className="ic-body">
                  <div className="ic-stat">
                    <span className="stat-label">Last Updated</span>
                    <span className="stat-value">{formatTime(zone.last_updated)}</span>
                  </div>
                </div>

                <div className="ic-footer">
                  <div className="status-toggle-wrapper">
                    <span className={`status-label ${zone.irrigation_status === 'On' ? 'text-accent' : 'text-secondary'}`}>
                      {zone.irrigation_status === 'On' ? 'System Active' : 'System Standby'}
                    </span>
                    <button
                      className={`toggle-switch ${zone.irrigation_status === 'On' ? 'toggled' : ''}`}
                      onClick={() => toggleStatus(zone.irrigation_id, zone.irrigation_status)}
                      aria-label="Toggle irrigation"
                    >
                      <span className="toggle-slider"></span>
                    </button>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      )}

      {pendingDeletes.length > 0 && (
        <div className="irrigation-undo-stack">
          {pendingDeletes.map((zone) => {
            const displayNumber = zone.displayNumber ?? displayOrderMap.get(zone.irrigation_id) ?? zone.irrigation_id;

            return (
              <div key={zone.irrigation_id} className="irrigation-undo">
                <span>Zone #{displayNumber} removed.</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => undoRemove(zone.irrigation_id)}
                >
                  Undo
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IrrigationPage;

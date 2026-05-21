import { useCallback, useEffect, useState } from 'react';
import { Droplets, CloudRain, Sun, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './IrrigationPage.css';

const IrrigationPage = () => {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchControls = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('irrigation_control')
        .select('*')
        .order('last_updated', { ascending: false });
      if (error) throw error;
      setControls(data || []);
    } catch (err) {
      console.error('Failed to fetch irrigation controls:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const autoUpdateWeather = useCallback(async (condition) => {
    try {
      const newStatus = condition === 'Rainy' ? 'Off' : 'On';
      
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
          last_updated: new Date().toISOString() 
        })
        .neq('irrigation_id', 0);

      if (error) throw error;

      await fetchControls();
      
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
    try {
      const { error } = await supabase
        .from('irrigation_control')
        .update({ irrigation_status: newStatus, last_updated: new Date().toISOString() })
        .eq('irrigation_id', id);
      if (error) throw error;
      await fetchControls();

      await supabase.from('notifications').insert([{
        message: `Irrigation Zone #${id} has been turned ${newStatus} manually.`,
        type: 'Irrigation',
        status: 'Pending'
      }]);
    } catch (err) {
      console.error('Failed to update irrigation status:', err.message);
      alert('Failed to update status: ' + err.message);
    }
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
      
      const { error } = await supabase
        .from('irrigation_control')
        .update({ 
          weather_condition: condition, 
          irrigation_status: newStatus,
          last_updated: new Date().toISOString() 
        })
        .neq('irrigation_id', 0);

      if (error) throw error;
      await fetchControls();

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

  return (
    <div className="irrigation-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Smart Irrigation Control</h2>
          <p>Monitor and manually override AI-driven irrigation zones.</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 mr-2">
            <button className="px-3 py-1 text-xs hover:bg-white/10 rounded" onClick={() => simulateWeather('Sunny')}>Sunny</button>
            <button className="px-3 py-1 text-xs hover:bg-white/10 rounded" onClick={() => simulateWeather('Rainy')}>Rainy</button>
            <button className="px-3 py-1 text-xs hover:bg-white/10 rounded" onClick={() => simulateWeather('Cloudy')}>Cloudy</button>
          </div>
          <button className="btn btn-outline" onClick={addSimulatedZone}>Add Zone</button>
          <button className="btn btn-primary" onClick={fetchControls}><RefreshCw size={18} /> Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>
      ) : (
        <div className="irrigation-grid">
          {controls.length === 0 ? (
            <div className="col-span-full text-center p-12 text-secondary bg-[rgba(15,23,42,0.4)] rounded-2xl border border-white/5">
              No irrigation zones found.
            </div>
          ) : (
            controls.map(zone => (
              <div key={zone.irrigation_id} className={`irrigation-card ${zone.irrigation_status === 'On' ? 'is-active' : ''}`}>
                <div className="ic-top">
                  <div className="ic-icon">
                    {zone.weather_condition === 'Rainy' ? <CloudRain size={24} /> : zone.weather_condition === 'Sunny' ? <Sun size={24} /> : <Droplets size={24} />}
                  </div>
                  <div className="ic-status">
                    <span className="ic-label">System</span>
                    <span className={`ic-value ${zone.irrigation_status === 'On' ? 'text-accent' : 'text-secondary'}`}>{zone.irrigation_status}</span>
                  </div>
                </div>
                <div className="ic-details">
                  <div className="ic-row"><span>Zone ID</span><span className="text-white">Zone #{zone.irrigation_id}</span></div>
                  <div className="ic-row"><span>Weather</span><span className="text-white">{zone.weather_condition}</span></div>
                  <div className="ic-row"><span>Last Update</span><span className="text-white">{formatTime(zone.last_updated)}</span></div>
                </div>
                <button
                  className={`btn w-full mt-4 ${zone.irrigation_status === 'On' ? 'btn-outline border-red-500/50 text-red-400 hover:bg-red-500/10' : 'btn-primary'}`}
                  onClick={() => toggleStatus(zone.irrigation_id, zone.irrigation_status)}
                >
                  {zone.irrigation_status === 'On' ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default IrrigationPage;

import React, { useState, useEffect } from 'react';
import { Droplets, CloudRain, Sun, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './IrrigationPage.css';

const IrrigationPage = () => {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('irrigation_control')
        .select('*')
        .order('last_updated', { ascending: false });
      if (error) throw error;
      setControls(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'On' ? 'Off' : 'On';
    try {
      const { error } = await supabase
        .from('irrigation_control')
        .update({ irrigation_status: newStatus, last_updated: new Date().toISOString() })
        .eq('irrigation_id', id);
      if (error) throw error;
      fetchControls();

    } catch (err) {
      alert('Failed to update status');
    }
  };

  const addSimulatedZone = async () => {
    try {
      const { error } = await supabase
        .from('irrigation_control')
        .insert([{ weather_condition: 'Sunny', irrigation_status: 'On' }]);
      if (error) throw error;
      fetchControls();
    } catch(err) {
      alert('Failed');
    }
  };

  return (
    <div className="irrigation-page fade-up">
      <div className="page-header">
        <div className="page-title">
          <h2>Smart Irrigation Control</h2>
          <p>Monitor and manually override AI-driven irrigation zones.</p>
        </div>
        <div className="flex gap-4">
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
                  <div className="ic-row"><span>Last Update</span><span className="text-white">{new Date(zone.last_updated).toLocaleTimeString()}</span></div>
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

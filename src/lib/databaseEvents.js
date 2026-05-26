// Database helper utilities for system logs, notifications, and row-change assertions.
//
// Key design decisions:
// - createSystemLog now accepts an optional manager_id so the Logs page can
//   display which manager performed each action.
// - Both helpers catch & log their own errors when called via the "safe"
//   wrappers (safeCreateSystemLog / safeCreateNotification) so that a
//   side-effect failure (e.g. logging) never crashes the primary CRUD action
//   the user triggered.

export const createSystemLog = async (payload) => {
  const { supabase, action_type, details, manager_id } = payload;

  const row = { action_type, details };
  if (manager_id) row.manager_id = manager_id;

  const { error } = await supabase
    .from('system_logs')
    .insert([row]);

  if (error) throw error;
};

export const createNotification = async (payload) => {
  const { supabase, message, type = 'System', status = 'Pending' } = payload;
  const { error } = await supabase
    .from('notifications')
    .insert([{ message, type, status }]);

  if (error) throw error;
};

export const ensureChanged = (data, actionLabel) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error(`${actionLabel} did not change any database rows.`);
  }
};

// ---------- Safe (non-throwing) wrappers ----------
// Use these for side-effect writes that should never block the main operation.

export const safeCreateSystemLog = async (payload) => {
  try {
    await createSystemLog(payload);
  } catch (err) {
    console.warn('System log side-effect failed (non-blocking):', err.message);
  }
};

export const safeCreateNotification = async (payload) => {
  try {
    await createNotification(payload);
  } catch (err) {
    console.warn('Notification side-effect failed (non-blocking):', err.message);
  }
};

// Helper: resolve the current user's manager_id (or null if not a manager).
export const resolveManagerId = async (supabase) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data } = await supabase
      .from('managers')
      .select('manager_id')
      .eq('email', user.email)
      .maybeSingle();

    return data?.manager_id ?? null;
  } catch {
    return null;
  }
};

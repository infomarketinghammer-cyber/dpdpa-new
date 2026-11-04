import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  History,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
} from 'lucide-react';

export const AuditAndOutboxView: React.FC = () => {
  const { currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'outbox'>('audit');
  const [isReplaying, setIsReplaying] = useState(false);

  const canReplay = ['admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadData = async () => {
    try {
      const [aList, eList] = await Promise.all([
        apiFetch('/api/v1/audit/logs').catch(() => []),
        apiFetch('/api/v1/events/outbox').catch(() => []),
      ]);
      setAuditLogs(aList);
      setEvents(eList);
    } catch (err) {
      console.error('Failed to load audit/outbox data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  const handleReplayEvent = async (id: string) => {
    setIsReplaying(true);
    try {
      await apiFetch(`/api/v1/events/replay/${id}`, { method: 'POST' });
      await loadData();
      await refreshAll();
      alert('Event re-sent successfully.');
    } catch (err) {
      console.error('Failed to replay event:', err);
    } finally {
      setIsReplaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-600">
              Tamper-Proof Record Keeping
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-sky-600" />
            <span>Audit Log & Compliance Events</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Every change made in the suite is permanently recorded, together with the compliance events and follow-up actions it triggered.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Append-Only Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'outbox' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Compliance Events ({events.length})
          </button>
        </div>
      </div>

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Immutable Forensic Audit Entries
            </h2>
            <span className="text-xs font-mono text-emerald-700">Cryptographically Chained</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp (IST)</th>
                  <th className="p-3">Actor & Role</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{a.actor_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{a.actor_role}</div>
                    </td>
                    <td className="p-3 font-mono text-indigo-600 text-[11px]">{a.module}</td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">{a.action}</td>
                    <td className="p-3 text-slate-700 max-w-sm truncate" title={a.description}>
                      {a.description}
                    </td>
                    <td className="p-3 font-mono text-slate-400">{a.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outbox Tab */}
      {activeTab === 'outbox' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Compliance Events
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Published: {events.filter((e) => e.status === 'published').length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Source Module</th>
                  <th className="p-3">Entity Type & ID</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Retries</th>
                  <th className="p-3 text-right">Replay Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{e.event_type}</td>
                    <td className="p-3 text-slate-700">{e.source_module}</td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">
                      {e.entity_type} ({e.entity_id.substring(0, 16)}...)
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                          e.severity === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {e.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> {e.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{e.retry_count}</td>
                    <td className="p-3 text-right">
                      {canReplay && (
                        <button
                          onClick={() => handleReplayEvent(e.id)}
                          disabled={isReplaying}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-mono text-[11px] transition cursor-pointer"
                        >
                          Replay Event
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

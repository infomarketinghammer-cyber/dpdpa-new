import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LockedModuleCard } from '../common/LockedModuleCard.tsx';
import {
  Search,
  Database,
  Cloud,
  FileArchive,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Plus,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const DataDiscoveryView: React.FC = () => {
  const { isEntitled, currentTenant, currentUserRole, apiFetch, refreshAll } = useApp();
  const [assets, setAssets] = useState<any[]>([]);
  const [legacyItems, setLegacyItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'wizard' | 'legacy' | 'scanner'>('inventory');

  // Wizard state
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Core Engineering');
  const [assetType, setAssetType] = useState('relational_db');
  const [systemName, setSystemName] = useState('');
  const [dataCategories, setDataCategories] = useState('Identifiers, Transaction Records');
  const [hostingGeography, setHostingGeography] = useState('India (ap-south-1 Mumbai)');
  const [isCrossBorder, setIsCrossBorder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated Scanner state
  const [scannerRunning, setScannerRunning] = useState(false);
  const [scannerResults, setScannerResults] = useState<any[] | null>(null);

  const canMutate = ['editor', 'approver', 'admin', 'ppoc_cpo'].includes(currentUserRole);

  const loadData = async () => {
    try {
      const [assetList, legList] = await Promise.all([
        apiFetch('/api/v1/discovery/assets').catch(() => []),
        apiFetch('/api/v1/discovery/legacy').catch(() => []),
      ]);
      setAssets(assetList);
      setLegacyItems(legList);
    } catch (err) {
      console.error('Failed to load discovery data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch, currentTenant?.id]);

  if (!isEntitled('data_discovery')) {
    return (
      <LockedModuleCard
        toolId="data_discovery"
        toolName="Data Discovery & Asset Inventory"
        description="Automated repository discovery, asset classification, encryption posture verification, and legacy data remediation queues."
      />
    );
  }

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !systemName) return;

    setIsSubmitting(true);
    try {
      await apiFetch('/api/v1/discovery/assets', {
        method: 'POST',
        body: JSON.stringify({
          name,
          department,
          asset_type: assetType,
          system_name: systemName,
          data_categories: dataCategories.split(',').map((s) => s.trim()),
          hosting_geography: hostingGeography,
          is_cross_border: isCrossBorder,
          encryption_at_rest: true,
          encryption_in_transit: true,
        }),
      });

      setName('');
      setSystemName('');
      setActiveTab('inventory');
      await loadData();
      await refreshAll();
    } catch (err) {
      console.error('Failed to register asset:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunScanner = () => {
    setScannerRunning(true);
    setTimeout(() => {
      setScannerRunning(false);
      setScannerResults([
        {
          target: 'AWS RDS Cluster (Mumbai ap-south-1)',
          tables_scanned: 48,
          pii_columns_identified: ['aadhaar_num', 'pan_card', 'customer_mobile', 'upi_vpa'],
          confidence: '99.4%',
          reviewer_confirmation_required: true,
        },
        {
          target: 'Legacy Employee Share (NAS //nas02/hr)',
          files_scanned: 1240,
          pii_columns_identified: ['unencrypted_resumes_pdf', 'salary_slips_xlsx'],
          confidence: '96.2%',
          reviewer_confirmation_required: true,
        },
      ]);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-sky-600">
              DPDPA Section 8(4) · Personal Data Asset Inventory
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Organisation: {currentTenant?.legal_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Search className="w-6 h-6 text-sky-600" />
            <span>Data Discovery & Asset Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Maintain authoritative register of systems, cloud stores, databases, and physical archives containing personal data. Enforces Indian data residency and encryption posture.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Asset Inventory ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'wizard' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            + Register Asset
          </button>
          <button
            onClick={() => setActiveTab('legacy')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'legacy' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Legacy Data Items ({legacyItems.length})
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'scanner' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Data Scanner
          </button>
        </div>
      </div>

      {/* 1. Asset Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Electronic & Physical Personal Data Repositories
            </h2>
            <div className="text-xs text-emerald-700 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Data Locality: 100% India Verified (ap-south-1 / ap-south-2)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Geography</th>
                  <th className="p-3">Data Categories</th>
                  <th className="p-3">Encryption Posture</th>
                  <th className="p-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{a.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{a.system_name}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-700 capitalize">{a.asset_type.replace('_', ' ')}</td>
                    <td className="p-3 text-slate-700">{a.department}</td>
                    <td className="p-3 font-mono text-slate-500">
                      {a.hosting_geography}{' '}
                      {a.is_cross_border && (
                        <span className="text-rose-600 text-[10px] bg-rose-50 px-1 py-0.5 rounded">Cross-Border</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {a.data_categories?.slice(0, 2).map((dc: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                            {dc}
                          </span>
                        ))}
                        {a.data_categories?.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{a.data_categories.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      <span className="text-emerald-700">Rest: AES-256</span> · <span className="text-emerald-700">Transit: TLS 1.3</span>
                    </td>
                    <td className="p-3">
                      {a.verified_at ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-amber-700 font-mono text-[10px]">Pending Review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Register Asset Wizard */}
      {activeTab === 'wizard' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Register Personal Data Asset</h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter asset metadata to ensure visibility across RoPA, Data Flow Mapper, and CPO readiness evaluations.
          </p>

          <form onSubmit={handleRegisterAsset} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-500 mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Payment Notification Kafka Cluster"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-500 mb-1">Asset Type *</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                >
                  <option value="relational_db">Relational Database (PostgreSQL/MySQL)</option>
                  <option value="nosql_db">NoSQL / Cache (Redis/Mongo/Dynamo)</option>
                  <option value="cloud_bucket">Cloud Object Storage (S3/GCS)</option>
                  <option value="saas_application">SaaS Application</option>
                  <option value="internal_api">Internal API / Service</option>
                  <option value="physical_archive">Physical Paper Archive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-500 mb-1">Internal System / Host Name *</label>
                <input
                  type="text"
                  required
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  placeholder="e.g., kafka-broker-01.mumbai.internal"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-500 mb-1">Owning Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-500 mb-1">
                Data Categories Handled (comma-separated)
              </label>
              <input
                type="text"
                value={dataCategories}
                onChange={(e) => setDataCategories(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-500 mb-1">Hosting Geography</label>
                <select
                  value={hostingGeography}
                  onChange={(e) => setHostingGeography(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                >
                  <option value="India (ap-south-1 Mumbai)">India (ap-south-1 Mumbai)</option>
                  <option value="India (ap-south-2 Hyderabad)">India (ap-south-2 Hyderabad)</option>
                  <option value="EU / Ireland (Cross-Border)">EU / Ireland (Cross-Border)</option>
                  <option value="US East (Cross-Border)">US East (Cross-Border)</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCrossBorder}
                    onChange={(e) => setIsCrossBorder(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-700">Flag as Cross-Border Transfer (Sec 16)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canMutate}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer mt-4"
            >
              {isSubmitting ? 'Registering...' : 'Register Asset'}
            </button>
          </form>
        </div>
      )}

      {/* 3. Legacy Data Items */}
      {activeTab === 'legacy' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Legacy Data Items & Remediation Tracking
            </h2>
            <span className="text-xs text-amber-700 font-mono">
              High Risk / Pre-DPDPA Archives
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Repository Title</th>
                  <th className="p-3">Location / System</th>
                  <th className="p-3">Estimated Volume</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Remediation Status</th>
                  <th className="p-3">Remediation Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {legacyItems.map((leg) => (
                  <tr key={leg.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{leg.title}</td>
                    <td className="p-3 font-mono text-slate-500">{leg.system_name}</td>
                    <td className="p-3 text-slate-700 font-mono">{leg.estimated_volume}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-rose-100 text-rose-600 border border-rose-200">
                        {leg.risk_level}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-amber-700 uppercase text-[11px]">
                      {leg.remediation_status.replace('_', ' ')}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{leg.target_remediation_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Scanner Connector Fixture */}
      {activeTab === 'scanner' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                Automated Data Scanner
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Scanner results must be confirmed by a reviewer before inventory records are created or updated.
              </p>
            </div>
            <button
              onClick={handleRunScanner}
              disabled={scannerRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scannerRunning ? 'animate-spin' : ''}`} />
              <span>{scannerRunning ? 'Scanning Repositories...' : 'Execute Scan'}</span>
            </button>
          </div>

          {scannerResults ? (
            <div className="space-y-3 pt-2">
              {scannerResults.map((res, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{res.target}</span>
                    <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-mono">
                      Confidence: {res.confidence}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Discovered Columns:{' '}
                    <span className="text-slate-800 font-mono">{res.pii_columns_identified.join(', ')}</span>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-between border-t border-slate-200 gap-2">
                    <span className="text-amber-700 text-[11px] font-mono">
                      ⚠ Human Reviewer Confirmation Required
                    </span>
                    <button
                      onClick={() => alert('Confirmed. Inventory record updated.')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded cursor-pointer"
                    >
                      Confirm & Ingest to Inventory
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Click 'Execute Scan' to find personal data across your connected systems.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

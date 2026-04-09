import { createClient } from "@/utils/supabase/server";
import { Users, GraduationCap, Building, Briefcase } from "lucide-react";
import CertificateReviewList from "./certificate-review-list";

export default async function AdminDashboard({ profile: initialProfile }: { profile?: any }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = initialProfile;
  if (!profile && user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  // Fetch counts for KPI cards
  const { count: totalCandidates } = await supabase.from("profiles").select("*", { count: "exact", head: true }).like("role", "candidate%");
  const { count: mvpCandidates } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate_mvp");
  const { count: onholdCandidates } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate_onhold");
  const { count: totalEmployers } = await supabase.from("profiles").select("*", { count: "exact", head: true }).like("role", "employer%");
  const { count: totalJobs } = await supabase.from("jobs").select("*", { count: "exact", head: true });

  // Fetch pending certificates
  const { data: pendingCertificates } = await supabase
    .from("certificates")
    .select("*, profiles(name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const passRate = totalCandidates ? Math.round(((mvpCandidates || 0) / (totalCandidates || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-600">Admin Control Center</h1>
            <p className="text-zinc-500 mt-1">Platform Analytics and Overviews.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total Candidates" value={totalCandidates || 0} icon={<Users className="w-5 h-5 text-blue-500" />} />
          <KpiCard title="MVP (Verified)" value={mvpCandidates || 0} icon={<GraduationCap className="w-5 h-5 text-green-500" />} trend={`${passRate}% pass rate`} />
          <KpiCard title="On-hold Candidates" value={onholdCandidates || 0} icon={<Users className="w-5 h-5 text-orange-500" />} />
          <KpiCard title="Total Employers" value={totalEmployers || 0} icon={<Building className="w-5 h-5 text-purple-500" />} />
          <KpiCard title="Imported Jobs" value={totalJobs || 0} icon={<Briefcase className="w-5 h-5 text-zinc-500" />} trend="Across all sources" />
        </div>

        <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl">
           <h2 className="text-xl font-semibold mb-6">Pending Certificate Approvals</h2>
           <CertificateReviewList certificates={pendingCertificates || []} />
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-medium text-zinc-500 dark:text-zinc-400 text-sm">{title}</h3>
        <div className="p-2 bg-zinc-50 dark:bg-[#1a1c23] rounded-lg">{icon}</div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold">{value}</span>
        {trend && <span className="text-xs text-brand-600 mt-2 font-medium">{trend}</span>}
      </div>
    </div>
  )
}


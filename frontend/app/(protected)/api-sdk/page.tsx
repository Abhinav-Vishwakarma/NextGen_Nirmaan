import type { JSX } from 'react'
import { ArrowRight, BookOpen, Code2, KeyRound, PlugZap, Server, ShieldCheck } from 'lucide-react'

const apiPackages = [
	{
		name: 'Core Compliance API',
		details: 'Document ingestion, compliance scoring, and alert generation endpoints.',
	},
	{
		name: 'Workflow Webhooks',
		details: 'Push compliance events to partner systems in near real-time.',
	},
	{
		name: 'SDK Bundles',
		details: 'TypeScript and Python SDKs for rapid integration in product teams.',
	},
]

export default function ApiSdkPage(): JSX.Element {
	return (
		<div className="mx-auto max-w-7xl space-y-8 pb-12">
			<header className="rounded-3xl border border-slate-800/80 bg-[#0f172a]/70 p-8 backdrop-blur-sm">
				<div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
					<Code2 size={14} />
					API + SDK Business
				</div>
				<h1 className="mt-4 text-4xl font-black tracking-tight text-slate-100">Developer Platform</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
					Beyond subscription seats, we provide APIs and SDKs for easy enterprise integration. This enables partner
					apps, internal tools, and third-party products to consume compliance intelligence directly.
				</p>
			</header>

			<section className="grid gap-6 lg:grid-cols-3">
				{apiPackages.map((pkg) => (
					<article key={pkg.name} className="rounded-2xl border border-slate-800/80 bg-[#111827]/70 p-6">
						<h2 className="text-lg font-semibold text-slate-100">{pkg.name}</h2>
						<p className="mt-2 text-sm leading-6 text-slate-400">{pkg.details}</p>
					</article>
				))}
			</section>

			<section className="grid gap-6 md:grid-cols-2">
				<article className="rounded-2xl border border-slate-800/80 bg-[#111827]/70 p-6">
					<h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
						<PlugZap size={18} className="text-cyan-400" />
						Integration Journey
					</h3>
					<ol className="mt-4 space-y-3 text-sm text-slate-300">
						<li>1. Generate an API key per workspace or environment.</li>
						<li>2. Install SDK and initialize client with secure credentials.</li>
						<li>3. Send documents or project metadata for compliance analysis.</li>
						<li>4. Receive scored results and webhook alerts in downstream systems.</li>
					</ol>
				</article>

				<article className="rounded-2xl border border-slate-800/80 bg-[#111827]/70 p-6">
					<h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
						<Server size={18} className="text-cyan-400" />
						Commercial Packaging
					</h3>
					<ul className="mt-4 space-y-3 text-sm text-slate-300">
						<li>1. API calls included per plan, then metered overage pricing.</li>
						<li>2. Dedicated API plans for partners without dashboard seats.</li>
						<li>3. Premium support and onboarding for mission-critical integrations.</li>
						<li>4. White-label and embedded compliance options for OEM partners.</li>
					</ul>
				</article>
			</section>

			<section className="rounded-2xl border border-slate-800/80 bg-[#111827]/70 p-6">
				<h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
					<ShieldCheck size={18} className="text-cyan-400" />
					Developer-Ready Foundation
				</h3>
				<div className="mt-4 grid gap-4 md:grid-cols-3">
					<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
						<p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
							<KeyRound size={16} className="text-cyan-400" />
							Auth
						</p>
						<p className="mt-2 text-xs leading-5 text-slate-400">Scoped keys, rotation policy, and environment isolation.</p>
					</div>
					<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
						<p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
							<BookOpen size={16} className="text-cyan-400" />
							Docs
						</p>
						<p className="mt-2 text-xs leading-5 text-slate-400">Quick-start guides, API reference, and production checklists.</p>
					</div>
					<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
						<p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
							<ArrowRight size={16} className="text-cyan-400" />
							Go-Live
						</p>
						<p className="mt-2 text-xs leading-5 text-slate-400">Sandbox-to-production rollout with observability hooks.</p>
					</div>
				</div>
			</section>
		</div>
	)
}


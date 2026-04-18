import type { JSX } from 'react'
import { CheckCircle2, CreditCard, Rocket, ShieldCheck } from 'lucide-react'

const plans = [
	{
		name: 'Starter',
		price: '$99/mo',
		description: 'For pilot projects and smaller compliance teams.',
		features: ['Up to 3 projects', '1,000 document analyses/month', 'Email support', 'Basic API access'],
	},
	{
		name: 'Growth',
		price: '$349/mo',
		description: 'For growing operations with multi-team workflows.',
		features: ['Up to 15 projects', '10,000 document analyses/month', 'Priority support', 'Advanced API + webhooks'],
		highlighted: true,
	},
	{
		name: 'Enterprise',
		price: 'Custom',
		description: 'For large organizations with strict governance requirements.',
		features: ['Unlimited projects', 'Custom analysis volume', 'Dedicated success manager', 'SSO, SLA, and private deployment'],
	},
]

export default function SubscriptionPage(): JSX.Element {
	return (
		<div className="mx-auto max-w-7xl space-y-8 pb-12">
			<header className="rounded-3xl border border-slate-800/80 bg-[#0f172a]/70 p-8 backdrop-blur-sm">
				<div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
					<CreditCard size={14} />
					Subscription Model
				</div>
				<h1 className="mt-4 text-4xl font-black tracking-tight text-slate-100">Plans and Billing</h1>
				<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
					Revenue is driven by a subscription model with monthly and annual contracts. Usage-based overages can be
					applied for document analysis volume and premium automation workflows.
				</p>
			</header>

			<section className="grid gap-6 lg:grid-cols-3">
				{plans.map((plan) => (
					<article
						key={plan.name}
						className={`rounded-2xl border p-6 ${
							plan.highlighted
								? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_20px_45px_-25px_rgba(99,102,241,0.65)]'
								: 'border-slate-800/80 bg-[#111827]/70'
						}`}
					>
						<h2 className="text-xl font-bold text-slate-100">{plan.name}</h2>
						<p className="mt-2 text-3xl font-black text-white">{plan.price}</p>
						<p className="mt-2 text-sm text-slate-400">{plan.description}</p>
						<ul className="mt-5 space-y-3">
							{plan.features.map((feature) => (
								<li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
									<CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
									<span>{feature}</span>
								</li>
							))}
						</ul>
					</article>
				))}
			</section>

			<section className="grid gap-6 md:grid-cols-2">
				<article className="rounded-2xl border border-slate-800/80 bg-[#111827]/70 p-6">
					<h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
						<Rocket size={18} className="text-indigo-400" />
						Monetization Streams
					</h3>
					<ul className="mt-4 space-y-3 text-sm text-slate-300">
						<li>1. Subscription tiers: Starter, Growth, Enterprise.</li>
						<li>2. Add-ons: premium analytics, dedicated support, and custom integrations.</li>
						<li>3. API metering: usage-based billing for high-volume API calls.</li>
						<li>4. Implementation packages for enterprise onboarding.</li>
					</ul>
				</article>

				<article className="rounded-2xl border border-slate-800/80 bg-[#111827]/70 p-6">
					<h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
						<ShieldCheck size={18} className="text-indigo-400" />
						Commercial Guardrails
					</h3>
					<ul className="mt-4 space-y-3 text-sm text-slate-300">
						<li>1. Annual contracts include discounting and reserved usage.</li>
						<li>2. Monthly contracts include clear overage pricing.</li>
						<li>3. Enterprise plans include SLA, security review, and compliance support.</li>
						<li>4. Billing cycles and tax handling should be automated in checkout.</li>
					</ul>
				</article>
			</section>
		</div>
	)
}


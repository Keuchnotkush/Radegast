"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { NavAvatar, BottomTabBar, SectionTitle, P, ease, spring } from "../shared";
import { useUser, PROFILE_LABELS } from "../store";
const CURRENCIES = ["USD", "EUR", "GBP", "CHF"];
const LANGUAGES = ["English", "Fran\u00e7ais", "Deutsch", "Espa\u00f1ol"];

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  dateOfBirth: string;
  investorProfile: string;
  currency: string;
  language: string;
  notifications: {
    trades: boolean;
    aiRecommendations: boolean;
    priceAlerts: boolean;
    weeklyReport: boolean;
    marketing: boolean;
  };
}

export default function EditPage() {
  const user = useUser();
  const [form, setForm] = useState<EditForm>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: "",
    country: "",
    city: "",
    dateOfBirth: "",
    investorProfile: "Growth",
    currency: "EUR",
    language: "Fran\u00e7ais",
    notifications: {
      trades: true,
      aiRecommendations: true,
      priceAlerts: true,
      weeklyReport: false,
      marketing: false,
    },
  });
  const [saved, setSaved] = useState(false);
  const [hoverCount, setHoverCount] = useState(0);

  const initial = form.firstName.charAt(0).toUpperCase();

  function update<K extends keyof EditForm>(field: K, value: EditForm[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function toggleNotif(key: keyof EditForm["notifications"]) {
    setForm((f) => ({ ...f, notifications: { ...f.notifications, [key]: !f.notifications[key] } }));
    setSaved(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen pb-24 md:pb-16" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={initial} />
      <BottomTabBar />

      <div className="max-w-2xl mx-auto px-5 md:px-8 pt-20 pb-16">

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-medium mb-10" style={{ color: P.gray }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to portfolio
          </Link>
        </motion.div>

        {/* Avatar + nom */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="flex items-center gap-5 mb-14">
          <motion.div whileHover={{ scale: 1.08 }} transition={spring}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: P.terracotta, color: P.white }}
          >{initial}</motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Edit Profile</h1>
            <p className="text-[14px] mt-1" style={{ color: P.gray }}>{form.firstName} {form.lastName}</p>
          </div>
        </motion.div>

        {/* Personal Info */}
        <Section>
          <SectionTitle>Personal Information</SectionTitle>
          <div className="flex flex-col gap-5 mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First name" value={form.firstName} onChange={(v) => update("firstName", v)} />
              <Field label="Last name" value={form.lastName} onChange={(v) => update("lastName", v)} />
            </div>
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" />
            <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} type="tel" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Country" value={form.country} onChange={(v) => update("country", v)} />
              <Field label="City" value={form.city} onChange={(v) => update("city", v)} />
            </div>
            <Field label="Date of birth" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} type="date" />
          </div>
        </Section>

        {/* Investor Profile */}
        <Section>
          <SectionTitle>Investor Profile</SectionTitle>
          <p className="text-[13px] mt-2 mb-5" style={{ color: P.gray }}>
            This shapes how the AI allocates your portfolio and manages risk.
          </p>
          <div className="flex rounded-full p-1" style={{ background: P.bg }}>
            {PROFILE_LABELS.map((p) => {
              const active = form.investorProfile === p;
              return (
                <motion.button
                  key={p}
                  onClick={() => update("investorProfile", p)}
                  animate={{ background: active ? P.dark : "transparent", color: active ? P.white : P.gray, scale: active ? 1.05 : 1 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="relative flex-1 py-3 rounded-full text-[14px] font-semibold cursor-pointer whitespace-nowrap"
                >{p}</motion.button>
              );
            })}
          </div>
        </Section>

        {/* Preferences */}
        <Section>
          <SectionTitle>Preferences</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <SelectField label="Currency" value={form.currency} options={CURRENCIES} onChange={(v) => update("currency", v)} />
            <SelectField label="Language" value={form.language} options={LANGUAGES} onChange={(v) => update("language", v)} />
          </div>
        </Section>

        {/* Notifications */}
        <Section>
          <SectionTitle>Notifications</SectionTitle>
          <div className="flex flex-col gap-4 mt-5">
            <NotifRow label="Trade confirmations" desc="Get notified when a trade executes" checked={form.notifications.trades} onChange={() => toggleNotif("trades")} />
            <NotifRow label="AI recommendations" desc="New buy/sell suggestions from the advisor" checked={form.notifications.aiRecommendations} onChange={() => toggleNotif("aiRecommendations")} />
            <NotifRow label="Price alerts" desc="When a stock moves more than 5%" checked={form.notifications.priceAlerts} onChange={() => toggleNotif("priceAlerts")} />
            <NotifRow label="Weekly report" desc="Portfolio summary every Monday" checked={form.notifications.weeklyReport} onChange={() => toggleNotif("weeklyReport")} />
            <NotifRow label="Marketing" desc="Product updates and new features" checked={form.notifications.marketing} onChange={() => toggleNotif("marketing")} />
          </div>
        </Section>

        {/* Save */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onHoverStart={() => setHoverCount((h) => h + 1)}
          transition={spring} onClick={save}
          className="relative w-full py-4 rounded-xl text-[15px] font-bold overflow-hidden cursor-pointer mt-8"
          style={{ background: saved ? P.jade : P.dark, color: P.white }}
        >
          <motion.span
            key={`${saved}-${hoverCount}`}
            initial={{ opacity: 0, filter: "blur(8px)", scale: 0.9 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            transition={{ duration: 0.4, ease }}
            className="block"
          >{saved ? "Saved!" : "Save changes"}</motion.span>
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}
      className="p-6 rounded-2xl mb-6"
      style={{ background: P.surface, border: `1px solid ${P.border}30` }}
    >{children}</motion.section>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "Lexend", color: P.gray }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full py-3.5 px-5 rounded-xl text-[15px] font-medium outline-none transition"
        style={{ background: P.bg, color: P.dark, border: `1.5px solid ${P.border}40` }}
        onFocus={(e) => (e.currentTarget.style.borderColor = P.jade)}
        onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}40`)}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "Lexend", color: P.gray }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full py-3.5 px-5 rounded-xl text-[15px] font-medium outline-none transition appearance-none cursor-pointer"
        style={{ background: P.bg, color: P.dark, border: `1.5px solid ${P.border}40` }}
        onFocus={(e) => (e.currentTarget.style.borderColor = P.jade)}
        onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}40`)}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function NotifRow({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[15px] font-semibold">{label}</div>
        <p className="text-[12px] mt-0.5" style={{ color: P.gray }}>{desc}</p>
      </div>
      <button onClick={onChange} className="cursor-pointer shrink-0">
        <motion.div animate={{ background: checked ? P.jade : P.border }} transition={{ duration: 0.3 }} className="relative w-12 h-7 rounded-full">
          <motion.div animate={{ x: checked ? 22 : 3 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 w-5 h-5 rounded-full bg-white" />
        </motion.div>
      </button>
    </div>
  );
}

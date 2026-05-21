"use client";
import { useState, use } from "react";
import { useStore } from "@/lib/store";
import SignatureCanvas from "@/components/SignatureCanvas";
import { ArrowLeft, Plus, Trash2, CheckCircle, Printer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Attendee, Gender, Equity, AgeGroup } from "@/lib/types";

const EMPTY_ATTENDEE = {
  name: "",
  employeeId: "",
  jobTitle: "",
  gender: "" as Gender,
  equity: "" as Equity,
  passportId: "",
  ageGroup: "" as AgeGroup,
  disabled: false,
  learnership: false,
  signature: "",
};

function AttendeeForm({
  onAdd,
}: {
  onAdd: (a: typeof EMPTY_ATTENDEE) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_ATTENDEE });
  const [success, setSuccess] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setBool = (key: "disabled" | "learnership") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.checked }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.employeeId.trim()) return;
    onAdd(form);
    setForm({ ...EMPTY_ATTENDEE });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-indigo-500" />
        Add Attendee
      </h2>
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Employee Number *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.employeeId}
              onChange={set("employeeId")}
              placeholder="EMP001"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Name & Surname *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.name}
              onChange={set("name")}
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Job Title</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.jobTitle}
              onChange={set("jobTitle")}
              placeholder="e.g. Supervisor"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Gender</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.gender}
              onChange={set("gender")}
            >
              <option value="">—</option>
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Equity</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.equity}
              onChange={set("equity")}
            >
              <option value="">—</option>
              <option value="A">A – African</option>
              <option value="C">C – Coloured</option>
              <option value="W">W – White</option>
              <option value="I">I – Indian/Asian</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Passport / ID Number</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.passportId}
              onChange={set("passportId")}
              placeholder="ID / Passport no."
            />
          </div>
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.disabled}
                onChange={setBool("disabled")}
                className="accent-indigo-600"
              />
              Disabled
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.learnership}
                onChange={setBool("learnership")}
                className="accent-indigo-600"
              />
              Learnership
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Signature <span className="font-normal text-gray-400">(draw in the box)</span>
          </label>
          <SignatureCanvas
            onSave={(v) => setForm((f) => ({ ...f, signature: v }))}
            onClear={() => setForm((f) => ({ ...f, signature: "" }))}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          {success ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Added!
            </>
          ) : (
            "Add to Register"
          )}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);
  const router = useRouter();
  const { topics, departments, attendees, addAttendee, deleteAttendee, updateTopic } = useStore();

  const topic = topics.find((t) => t.id === topicId);
  const dept = topic ? departments.find((d) => d.id === topic.departmentId) : null;
  const topicAttendees = attendees.filter((a) => a.topicId === topicId);

  const [showFacilitatorPad, setShowFacilitatorPad] = useState(true);
  const [facilitatorSig, setFacilitatorSig] = useState(() => topic?.trainerSignature || "");

  const handleFacilitatorSign = async (sig: string) => {
    if (!topic) return;
    setFacilitatorSig(sig);
    setShowFacilitatorPad(false);
    await updateTopic({ ...topic, trainerSignature: sig });
  };

  if (!topic || !dept) {
    return (
      <div className="p-8 text-center text-gray-400">
        Topic not found.{" "}
        <Link href="/topics" className="text-indigo-600 hover:underline">
          View topics
        </Link>
      </div>
    );
  }

  const handleAdd = (form: typeof EMPTY_ATTENDEE) => {
    addAttendee({ ...form, topicId, departmentId: dept.id });
  };

  // Footer stats
  const males = topicAttendees.filter((a) => a.gender === "M").length;
  const females = topicAttendees.filter((a) => a.gender === "F").length;
  const age1835 = topicAttendees.filter((a) => a.ageGroup === "18-35").length;
  const age3655 = topicAttendees.filter((a) => a.ageGroup === "36-55").length;
  const age55p = topicAttendees.filter((a) => a.ageGroup === "55+").length;
  const disabledM = topicAttendees.filter((a) => a.disabled && a.gender === "M").length;
  const disabledF = topicAttendees.filter((a) => a.disabled && a.gender === "F").length;
  const learnM = topicAttendees.filter((a) => a.learnership && a.gender === "M").length;
  const learnF = topicAttendees.filter((a) => a.learnership && a.gender === "F").length;

  const equityCount = (e: string) => topicAttendees.filter((a) => a.equity === e).length;

  return (
    <div className="p-6 max-w-7xl mx-auto register-print print:p-0 print:max-w-none">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* ── Print Logo (hidden on screen) ── */}
      <div className="hidden print:block mb-4">
        <img src="/logo.png" alt="Gold Rush" className="h-16" />
      </div>

      {/* ── Official Register Header ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 print:shadow-none print:rounded-none print:border-black">
        <div className="bg-gray-800 text-white text-center py-3">
          <h1 className="text-lg font-bold tracking-wide">Training Attendance Register</h1>
        </div>

        <div className="p-0">
          {/* Row 1 */}
          <div className="grid grid-cols-[120px_1fr_120px_1fr] border-b border-gray-200 text-sm">
            <div className="bg-gray-100 font-semibold px-3 py-2 border-r border-gray-200">Subject</div>
            <div className="px-3 py-2 border-r border-gray-200">{topic.subject || <span className="text-gray-300">—</span>}</div>
            <div className="bg-gray-100 font-semibold px-3 py-2 border-r border-gray-200">Department</div>
            <div className="px-3 py-2">{dept.name}</div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-[120px_1fr_140px_1fr_180px_1fr] border-b border-gray-200 text-sm">
            <div className="bg-gray-100 font-semibold px-3 py-2 border-r border-gray-200">Training Date</div>
            <div className="px-3 py-2 border-r border-gray-200">
              {topic.date ? new Date(topic.date).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" }) : <span className="text-gray-300">—</span>}
            </div>
            <div className="bg-gray-100 font-semibold px-3 py-2 border-r border-gray-200">Week-ending</div>
            <div className="px-3 py-2 border-r border-gray-200">
              {topic.weekEnding ? new Date(topic.weekEnding).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" }) : <span className="text-gray-300">—</span>}
            </div>
            <div className="bg-gray-100 font-semibold px-3 py-2 border-r border-gray-200">Location / Branch / Province</div>
            <div className="px-3 py-2">{topic.location || <span className="text-gray-300">—</span>}</div>
          </div>
          {/* Row 3 */}
          <div className="grid grid-cols-[120px_1fr_140px_1fr_180px_1fr] border-b border-gray-200 text-sm">
            <div className="bg-gray-100 font-semibold px-3 py-2 border-r border-gray-200">Time</div>
            <div className="px-3 py-2 border-r border-gray-200">{topic.time || <span className="text-gray-300">—</span>}</div>
            <div className="bg-gray-100 font-semibold px-3 py-2 border-r border-gray-200">Duration</div>
            <div className="px-3 py-2 border-r border-gray-200">{topic.duration || <span className="text-gray-300">—</span>}</div>
            <div className="bg-gray-100 font-semibold px-3 py-2 border-r border-gray-200">Lesson Plan Ref</div>
            <div className="px-3 py-2">{topic.lessonPlanRef || <span className="text-gray-300">—</span>}</div>
          </div>
        </div>
      </div>

      {/* ── Add Attendee Form ── */}
      <div className="print:hidden">
        <AttendeeForm onAdd={handleAdd} />
      </div>

      {/* ── Register Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-2 py-2 text-center border border-gray-600 w-8">#</th>
                <th className="px-3 py-2 text-left border border-gray-600 w-24">Employee No.</th>
                <th className="px-3 py-2 text-left border border-gray-600 w-36">Name & Surname</th>
                <th className="px-3 py-2 text-left border border-gray-600 w-28">Job Title</th>
                <th className="px-2 py-2 text-center border border-gray-600 w-8">M</th>
                <th className="px-2 py-2 text-center border border-gray-600 w-8">F</th>
                <th className="px-2 py-2 text-center border border-gray-600 w-8">A</th>
                <th className="px-2 py-2 text-center border border-gray-600 w-8">C</th>
                <th className="px-2 py-2 text-center border border-gray-600 w-8">W</th>
                <th className="px-2 py-2 text-center border border-gray-600 w-8">I</th>
                <th className="px-2 py-2 text-center border border-gray-600 w-12">Other</th>
                <th className="px-3 py-2 text-left border border-gray-600 w-32">Passport / ID No.</th>
                <th className="px-3 py-2 text-left border border-gray-600 w-28">Signature</th>
                <th className="px-2 py-2 border border-gray-600 w-8" />
              </tr>
              <tr className="bg-gray-700 text-gray-300 text-center text-[10px]">
                <td className="border border-gray-600" />
                <td colSpan={3} className="py-1 border border-gray-600 text-left px-3">Learner Details</td>
                <td colSpan={2} className="py-1 border border-gray-600">Gender</td>
                <td colSpan={5} className="py-1 border border-gray-600">Equity Training Statistics</td>
                <td colSpan={3} className="border border-gray-600" />
                <td className="border border-gray-600" />
              </tr>
            </thead>
            <tbody>
              {topicAttendees.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-2 py-2 text-center border border-gray-200 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-700">{a.employeeId}</td>
                  <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800">{a.name}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">{a.jobTitle || "—"}</td>
                  <td className="px-2 py-2 text-center border border-gray-200">{a.gender === "M" ? "✓" : ""}</td>
                  <td className="px-2 py-2 text-center border border-gray-200">{a.gender === "F" ? "✓" : ""}</td>
                  <td className="px-2 py-2 text-center border border-gray-200">{a.equity === "A" ? "✓" : ""}</td>
                  <td className="px-2 py-2 text-center border border-gray-200">{a.equity === "C" ? "✓" : ""}</td>
                  <td className="px-2 py-2 text-center border border-gray-200">{a.equity === "W" ? "✓" : ""}</td>
                  <td className="px-2 py-2 text-center border border-gray-200">{a.equity === "I" ? "✓" : ""}</td>
                  <td className="px-2 py-2 text-center border border-gray-200">{a.equity === "Other" ? "✓" : ""}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">{a.passportId || "—"}</td>
                  <td className="px-2 py-2 border border-gray-200">
                    {a.signature ? (
                      <img src={a.signature} alt="sig" className="h-8 w-24 object-contain" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-200 text-center">
                    <button
                      onClick={() => { if (confirm("Remove this attendee?")) deleteAttendee(a.id); }}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {/* Empty rows if fewer than 15 */}
              {Array.from({ length: Math.max(0, 15 - topicAttendees.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className={((topicAttendees.length + i) % 2 === 0) ? "bg-white" : "bg-gray-50"}>
                  <td className="px-2 py-3 text-center border border-gray-200 text-gray-300">{topicAttendees.length + i + 1}</td>
                  {Array.from({ length: 13 }).map((_, j) => (
                    <td key={j} className="border border-gray-200 py-3" />
                  ))}
                </tr>
              ))}

              {/* Totals row */}
              <tr className="bg-gray-800 text-white font-semibold">
                <td colSpan={4} className="px-3 py-2 border border-gray-600 text-center">Totals</td>
                <td className="px-2 py-2 text-center border border-gray-600">{males}</td>
                <td className="px-2 py-2 text-center border border-gray-600">{females}</td>
                <td className="px-2 py-2 text-center border border-gray-600">{equityCount("A")}</td>
                <td className="px-2 py-2 text-center border border-gray-600">{equityCount("C")}</td>
                <td className="px-2 py-2 text-center border border-gray-600">{equityCount("W")}</td>
                <td className="px-2 py-2 text-center border border-gray-600">{equityCount("I")}</td>
                <td className="px-2 py-2 text-center border border-gray-600">{equityCount("Other")}</td>
                <td colSpan={3} className="px-3 py-2 border border-gray-600 text-center">{topicAttendees.length} total</td>
              </tr>
              {/* Absent row */}
              <tr className="bg-gray-700 text-white font-semibold">
                <td colSpan={4} className="px-3 py-2 border border-gray-600 text-center">Absent</td>
                <td className="px-2 py-2 text-center border border-gray-600" />
                <td className="px-2 py-2 text-center border border-gray-600" />
                <td colSpan={8} className="border border-gray-600" />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Footer stats ── */}
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_2fr_1fr_1fr_2fr_1fr_1fr_auto] text-xs border-b border-gray-200">
            <div className="bg-gray-800 text-white font-semibold px-3 py-2 border-r border-gray-600">Age Groups</div>
            <div className="bg-gray-700 text-white text-center px-2 py-2 border-r border-gray-600">18–35</div>
            <div className="bg-gray-700 text-white text-center px-2 py-2 border-r border-gray-600">36–55</div>
            <div className="bg-gray-700 text-white text-center px-2 py-2 border-r border-gray-600">55+</div>
            <div className="bg-gray-700 text-white text-center px-2 py-2 border-r border-gray-600 col-span-2">Disabled Learners</div>
            <div className="bg-gray-700 text-white text-center px-2 py-2 border-r border-gray-600" />
            <div className="bg-gray-700 text-white text-center px-2 py-2 border-r border-gray-600 col-span-2">Learnerships</div>
            <div className="bg-gray-700 text-white text-center px-2 py-2 border-r border-gray-600" />
            <div className="bg-gray-700 text-white text-center px-2 py-2" />
          </div>
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] text-xs border-b border-gray-200">
            <div className="bg-gray-800 text-white font-semibold px-3 py-2 border-r border-gray-600">Total</div>
            <div className="text-center px-2 py-2 border-r border-gray-200 font-semibold">{age1835}</div>
            <div className="text-center px-2 py-2 border-r border-gray-200 font-semibold">{age3655}</div>
            <div className="text-center px-2 py-2 border-r border-gray-200 font-semibold">{age55p}</div>
            <div className="bg-gray-100 text-center px-2 py-2 border-r border-gray-200 text-gray-500 text-[10px]">Male</div>
            <div className="text-center px-2 py-2 border-r border-gray-200 font-semibold">{disabledM}</div>
            <div className="bg-gray-100 text-center px-2 py-2 border-r border-gray-200 text-gray-500 text-[10px]">Female</div>
            <div className="text-center px-2 py-2 border-r border-gray-200 font-semibold">{disabledF}</div>
            <div className="bg-gray-100 text-center px-2 py-2 border-r border-gray-200 text-gray-500 text-[10px]">Male</div>
            <div className="text-center px-2 py-2 border-r border-gray-200 font-semibold">{learnM}</div>
            <div className="bg-gray-100 text-center px-2 py-2 border-r border-gray-200 text-gray-500 text-[10px]">Female</div>
            <div className="text-center px-2 py-2 border-r border-gray-200 font-semibold">{learnF}</div>
            <div className="bg-gray-100 text-center px-2 py-2 border-r border-gray-200 text-gray-500 text-[10px]">Total</div>
            <div className="text-center px-2 py-2 font-semibold">{learnM + learnF}</div>
          </div>
        </div>

        {/* ── Facilitator Footer ── */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-8 text-sm text-gray-700 items-start">
            <span>
              <span className="font-semibold">Facilitator&apos;s Name:</span>{" "}
              {topic.trainer || <span className="text-gray-400 italic">Not specified</span>}
            </span>
            <div>
              <p className="font-semibold mb-1">Signature:</p>
              {facilitatorSig && !showFacilitatorPad ? (
                <div className="flex items-center gap-2">
                  <img src={facilitatorSig} alt="facilitator sig" className="h-10 w-36 object-contain border border-gray-200 rounded" />
                  <button
                    onClick={() => setShowFacilitatorPad(true)}
                    className="print:hidden text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    Re-sign
                  </button>
                </div>
              ) : (
                <div className="print:hidden w-72">
                  <SignatureCanvas onSave={handleFacilitatorSign} onClear={() => {}} />
                </div>
              )}
              {facilitatorSig && (
                <img src={facilitatorSig} alt="facilitator sig" className="hidden print:block h-10 w-36 object-contain" />
              )}
            </div>
            <span>
              <span className="font-semibold">Date:</span>{" "}
              {topic.date
                ? new Date(topic.date).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })
                : <span className="inline-block w-28 border-b border-gray-400" />}
            </span>
          </div>
        </div>
      </div>

      {/* Print note */}
      <p className="text-xs text-gray-400 text-center mb-2 print:hidden">
        PLEASE ENSURE YOUR EMPLOYEE NUMBER IS CORRECT.
      </p>
      <div className="text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Export PDF
        </button>
      </div>
    </div>
  );
}

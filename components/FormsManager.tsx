
import React, { useState, useMemo, useEffect } from 'react';
import { storage } from '../utils/storage';
import { PersonnelType, User } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { 
  FileText, Printer, Smartphone, Search, 
  X, CheckCircle2, FileBadge, ArrowLeftRight, Shield, 
  UserCircle, Building2, ListChecks, QrCode as QrIcon,
  ShieldCheck, Landmark, MapPin, Briefcase,
  Award, AlertTriangle, ScrollText, UserCog,
  ShieldAlert, Fingerprint,
  Stamp, Trash2
} from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

interface FormsManagerProps {
  currentUser: User;
}

const DOCUMENT_TYPES = [
  { id: 'leave', label: 'نموذج إجازة رسمية', icon: FileText, category: 'إداري' },
  { id: 'permission', label: 'إذن خروج مؤقت', icon: ArrowLeftRight, category: 'إداري' },
  { id: 'salary_cert', label: 'إفادة مرتب (لمن يهمه الأمر)', icon: Landmark, category: 'مالي' },
  { id: 'mission', label: 'أمر مهمة عمل خارجية', icon: Briefcase, category: 'عمليات' },
  { id: 'commendation', label: 'شهادة تقدير وتميز', icon: Award, category: 'تحفيزي' },
  { id: 'disciplinary', label: 'بلاغ إجراء انضباطي', icon: AlertTriangle, category: 'انضباطي' },
  { id: 'clearance', label: 'نموذج إخلاء طرف', icon: ScrollText, category: 'إداري' },
  { id: 'transfer', label: 'قرار نقل داخلي', icon: MapPin, category: 'إداري' },
];

const FormsManager: React.FC<FormsManagerProps> = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'id_cards'>('documents');
  const personnel = storage.getPersonnel();
  const departments = storage.getDepartments();
  const settings = storage.getSettings();

  // Documents State
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [targetPersonId, setTargetPersonId] = useState<string>('');
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const debouncedPersonSearchQuery = useDebounce(personSearchQuery, 300);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Customization Options
  const [customRemarks, setCustomRemarks] = useState('');
  const [selectedSignature, setSelectedSignature] = useState(settings.signatureTitles[2] || '');
  const [includeQr, setIncludeQr] = useState(true);

  // ID Cards State
  const [cardSelectionMode, setCardSelectionMode] = useState<'individual' | 'group' | 'department'>('individual');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [isCardPreviewOpen, setIsCardPreviewOpen] = useState(false);
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  // Logic: Searchable Personnel Selection
  const searchedPersonnel = useMemo(() => {
    if (!debouncedPersonSearchQuery) return [];
    return personnel.filter(p => 
      p.name.includes(debouncedPersonSearchQuery) || 
      p.militaryNumber.includes(debouncedPersonSearchQuery) || 
      p.nationalId.includes(debouncedPersonSearchQuery)
    ).slice(0, 5); // Limit for performance in dropdown
  }, [personnel, debouncedPersonSearchQuery]);

  const targetPerson = useMemo(() => personnel.find(p => p.id === targetPersonId), [personnel, targetPersonId]);

  const peopleForCards = useMemo(() => {
    if (cardSelectionMode === 'individual') return targetPerson ? [targetPerson] : [];
    if (cardSelectionMode === 'department') return personnel.filter(p => p.departmentId === selectedDeptId);
    if (cardSelectionMode === 'group') return personnel.filter(p => selectedGroupIds.has(p.id));
    return [];
  }, [cardSelectionMode, targetPerson, selectedDeptId, selectedGroupIds, personnel]);

  // QR and Barcode Generation for Cards
  useEffect(() => {
    if (isCardPreviewOpen && peopleForCards.length > 0) {
      const generateAssets = async () => {
        const newQrCodes: Record<string, string> = {};
        for (const p of peopleForCards) {
          try {
            const qrData = `SECURE_ID:${p.id}\nMIL_NO:${p.militaryNumber || 'CIV'}\nNAME:${p.name}\nRANK:${p.rank}\nORG:${settings.orgName}`;
            newQrCodes[p.id] = await QRCode.toDataURL(qrData, { 
              width: 150, 
              margin: 1,
              color: { dark: '#000000', light: '#ffffff' }
            });
          } catch (e) { console.error(e); }
        }
        setQrCodes(newQrCodes);

        setTimeout(() => {
          peopleForCards.forEach(p => {
            const canvas = document.getElementById(`card-barcode-${p.id}`) as HTMLCanvasElement;
            if (canvas) {
              try {
                JsBarcode(canvas, p.militaryNumber || p.nationalId || "00000000", {
                  format: "CODE128", displayValue: true, height: 35, width: 1.5, fontSize: 10
                });
              } catch (e) { console.error(e); }
            }
          });
        }, 150);
      };
      generateAssets();
    }
  }, [isCardPreviewOpen, peopleForCards, settings.orgName]);

  const getDocumentContent = () => {
    if (!targetPerson) return null;
    const militaryText = targetPerson.type === PersonnelType.MILITARY ? `بالرقم العسكري (${targetPerson.militaryNumber})` : `بالرقم الوطني (${targetPerson.nationalId})`;
    const deptName = departments.find(d => d.id === targetPerson.departmentId)?.name || 'غير محدد';

    switch (selectedDoc) {
      case 'leave':
        return (
          <div className="space-y-6 text-right leading-relaxed">
            <h3 className="text-2xl font-black text-center mb-8">إخطار إجازة رسمية مسبقة</h3>
            <p>يُفيد القسم الإداري بـ ({settings.orgName}) بأنه تم اعتماد إجازة للفرد المذكور أدناه:</p>
            <div className="bg-slate-50 p-6 rounded-2xl space-y-2 border">
               <p><span className="font-black">الاسم:</span> {targetPerson.name}</p>
               <p><span className="font-black">الرتبة:</span> {targetPerson.rank}</p>
               <p><span className="font-black">جهة العمل:</span> {deptName}</p>
            </div>
            <p>وذلك اعتباراً من تاريخ (........) وحتى تاريخ (........) بمجموع أيام قدره (........) يوماً، على أن يباشر عمله في تمام الساعة (08:00) من صباح اليوم التالي لانقضاء الإجازة.</p>
          </div>
        );
      case 'mission':
        return (
          <div className="space-y-6 text-right leading-relaxed">
            <h3 className="text-2xl font-black text-center mb-8">أمر مهمة عمل رسمية</h3>
            <p>بناءً على تعليمات القيادة، يُكلف {targetPerson.rank} / {targetPerson.name} {militaryText} بالقيام بمهمة عمل تخصصية إلى جهة (............................).</p>
            <p>على كافة الجهات الأمنية والعسكرية تسهيل مهام المعني وتذليل الصعاب أمامه لتنفيذ الواجب المناط به في المدة المحددة من (........) إلى (........).</p>
            {customRemarks && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900 italic text-sm">
                ملاحظة إضافية: {customRemarks}
              </div>
            )}
          </div>
        );
      case 'commendation':
        return (
          <div className="space-y-12 text-center py-10">
            <div className="flex justify-center"><Award size={80} className="text-amber-500"/></div>
            <h3 className="text-4xl font-black text-slate-900">شهادة تقدير وعرفان</h3>
            <p className="text-xl font-bold px-12 leading-loose">
              تتقدم إدارة ({settings.orgName}) بخالص الشكر والتقدير إلى {targetPerson.rank} / {targetPerson.name} <br/>
              وذلك نظير جهوده المخلصة وتفانيه في أداء الواجبات المنوطة به، متمنين له دوام التوفيق والنجاح في مسيرته العسكرية.
            </p>
          </div>
        );
      case 'disciplinary':
        return (
          <div className="space-y-6 text-right leading-relaxed text-red-900">
            <h3 className="text-2xl font-black text-center mb-8 underline decoration-red-200">بلاغ إجراء انضباطي رسمي</h3>
            <p>بعد المراجعة والتدقيق في سجل الانضباط، تقرر اتخاذ الإجراءات الموضحة أدناه في حق {targetPerson.rank} / {targetPerson.name}:</p>
            <div className="p-10 border-4 border-dashed border-red-100 rounded-[2.5rem] space-y-4">
               <p className="font-black">نوع المخالفة: ................................................................</p>
               <p className="font-black">العقوبة المقررة: ................................................................</p>
               <p className="font-black">تاريخ الإجراء: ................................................................</p>
            </div>
            <p className="text-xs text-red-500 font-bold italic text-center">يعتبر هذا البلاغ رسمياً ويُحفظ في الملف الشخصي للفرد.</p>
          </div>
        );
      case 'salary_cert':
        return (
          <div className="space-y-8 text-right">
            <h3 className="text-2xl font-black text-center mb-8">إفادة بيانات مرتب</h3>
            <p>تشهد الشؤون الإدارية والمالية بـ ({settings.orgName}) بأن {targetPerson.rank} / {targetPerson.name} {militaryText} يتقاضى مرتبه الشهري عن طريق (............................).</p>
            <p>تم إصدار هذه الإفادة بناءً على طلبه لتقديمها إلى (............................) دون أدنى مسؤولية علينا.</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-20 space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><ScrollText size={40}/></div>
             <p className="text-slate-400 font-black italic">يرجى اختيار نوع النموذج واستكمال البيانات لإظهار المعاينة.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Header Navigation */}
      <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-sm border dark:border-slate-800 w-fit no-print">
         <button onClick={() => setActiveTab('documents')} className={`px-10 py-4 rounded-3xl font-black text-sm flex items-center gap-3 transition-all ${activeTab === 'documents' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-slate-400 hover:bg-slate-50'}`}><FileBadge size={22}/> النماذج والتعريفات</button>
         <button onClick={() => setActiveTab('id_cards')} className={`px-10 py-4 rounded-3xl font-black text-sm flex items-center gap-3 transition-all ${activeTab === 'id_cards' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-slate-400 hover:bg-slate-50'}`}><Smartphone size={22}/> إصدار البطاقات التعريفية</button>
      </div>

      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Controls Panel (LHS) */}
           <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-sm space-y-8">
                 <div className="flex items-center gap-4 text-accent">
                    <div className="p-3 bg-accent/10 rounded-2xl"><UserCog size={24}/></div>
                    <h3 className="text-xl font-black">إعدادات النموذج</h3>
                 </div>

                 {/* Advanced Search Component */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ابحث عن الفرد (اسم/عسكري/وطني)</label>
                    <div className="relative group">
                       <Search className="absolute right-4 top-4 text-slate-300 group-focus-within:text-accent transition-colors" size={20}/>
                       <input 
                         type="text" 
                         placeholder="اكتب البيانات هنا..." 
                         className="w-full pr-12 pl-4 py-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-accent transition-all"
                         value={personSearchQuery}
                         onChange={e => setPersonSearchQuery(e.target.value)}
                       />
                       {searchedPersonnel.length > 0 && !targetPersonId && (
                         <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                           {searchedPersonnel.map(p => (
                             <button key={p.id} onClick={() => { setTargetPersonId(p.id); setPersonSearchQuery(''); }} className="w-full text-right px-6 py-4 hover:bg-accent hover:text-white transition-all border-b dark:border-slate-800 last:border-0">
                                <p className="font-black text-xs">{p.rank} / {p.name}</p>
                                <p className="text-[10px] opacity-60">#{p.militaryNumber || p.nationalId}</p>
                             </button>
                           ))}
                         </div>
                       )}
                    </div>
                 </div>

                 {targetPerson && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-[2rem] border-2 border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between animate-in zoom-in-95">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-emerald-500" size={20}/>
                          <div>
                             <p className="font-black text-xs">{targetPerson.name}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase">{targetPerson.rank}</p>
                          </div>
                       </div>
                       <button onClick={() => { setTargetPersonId(''); setPersonSearchQuery(''); }} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                 )}

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">نوع الوثيقة الرسمية</label>
                    <div className="grid grid-cols-1 gap-2">
                       {DOCUMENT_TYPES.map(doc => (
                         <button 
                           key={doc.id} 
                           onClick={() => setSelectedDoc(doc.id)}
                           className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedDoc === doc.id ? 'border-accent bg-accent/5 text-accent shadow-sm' : 'border-slate-50 dark:border-slate-800 text-slate-400 hover:border-accent/30'}`}
                         >
                            <div className="flex items-center gap-3">
                               <doc.icon size={18} className={selectedDoc === doc.id ? 'text-accent' : 'text-slate-300'}/>
                               <span className="font-black text-xs">{doc.label}</span>
                            </div>
                            <span className="text-[8px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase">{doc.category}</span>
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Customization Block */}
                 <div className="space-y-6 pt-6 border-t dark:border-slate-800">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">إضافة ملاحظات خاصة (اختياري)</label>
                       <textarea className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 outline-none font-bold text-xs min-h-[100px]" value={customRemarks} onChange={e => setCustomRemarks(e.target.value)} placeholder="مثال: يمنح المعني مكافأة تميز، أو ملاحظة سرية..."></textarea>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">جهة الاعتماد</label>
                       <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-black text-xs border dark:border-slate-700" value={selectedSignature} onChange={e => setSelectedSignature(e.target.value)}>
                          {settings.signatureTitles.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>

                    <button 
                      onClick={() => setIncludeQr(!includeQr)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl transition-all hover:bg-slate-100"
                    >
                       <div className="flex items-center gap-3">
                          <QrIcon size={18} className="text-slate-400"/>
                          <span className="text-xs font-black">إرفاق رمز QR للتأكيد</span>
                       </div>
                       {includeQr ? <CheckCircle2 size={20} className="text-accent"/> : <div className="w-5 h-5 rounded-full border-2"></div>}
                    </button>
                 </div>

                 <button 
                   disabled={!selectedDoc || !targetPersonId}
                   onClick={() => setIsPreviewOpen(true)}
                   className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black shadow-2xl flex justify-center items-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.02]"
                 >
                    <Printer size={22}/> توليد ومعاينة الوثيقة
                 </button>
              </div>
           </div>

           {/* Preview Panel (RHS) */}
           <div className="lg:col-span-8">
              <div className="bg-slate-100 dark:bg-slate-800/20 rounded-[4rem] h-full min-h-[800px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 p-10 relative overflow-hidden">
                 <ShieldAlert className="absolute top-10 left-10 text-slate-200 dark:text-slate-800" size={120}/>
                 
                 {!selectedDoc || !targetPersonId ? (
                   <div className="text-center space-y-4 relative z-10">
                      <div className="p-8 bg-white dark:bg-slate-900 rounded-full shadow-inner inline-block text-slate-200"><ScrollText size={64}/></div>
                      <p className="text-slate-400 font-black italic max-w-xs mx-auto leading-relaxed">بانتظار اختيار الفرد ونوع المستند لبناء هيكل الوثيقة الرقمية...</p>
                   </div>
                 ) : (
                   <div className="bg-white p-16 rounded-none shadow-2xl w-full max-w-2xl transform hover:scale-[1.01] transition-transform duration-500 relative z-10">
                      <div className="flex justify-between items-start mb-12 border-b-2 pb-6">
                         <img src={settings.logo} className="w-20 h-20 object-contain" />
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Archive Preview</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase">Status: Validated</p>
                         </div>
                      </div>
                      <div className="text-slate-800">
                         {getDocumentContent()}
                      </div>
                      <div className="mt-20 flex justify-between items-end opacity-20">
                         <div className="space-y-4">
                            <div className="w-32 h-1 bg-slate-200"></div>
                            <div className="w-24 h-1 bg-slate-100"></div>
                         </div>
                         <Fingerprint size={48}/>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'id_cards' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border dark:border-slate-800 shadow-sm space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b dark:border-slate-800 pb-10">
                 <div className="flex items-center gap-6">
                    <div className="p-5 bg-accent/10 rounded-[2rem] text-accent">
                       <Fingerprint size={32}/>
                    </div>
                    <div>
                       <h3 className="text-3xl font-black">نظام الهوية العسكرية الذكية</h3>
                       <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-[0.3em]">Smart Identity Generation System v3.1</p>
                    </div>
                 </div>
                 <div className="flex bg-gray-50 dark:bg-slate-800 p-2 rounded-[2.5rem] border dark:border-slate-700 shadow-inner">
                    {[
                      { id: 'individual', label: 'إصدار فردي', icon: UserCircle },
                      { id: 'group', label: 'مجموعات مختارة', icon: ListChecks },
                      { id: 'department', label: 'إدارات كاملة', icon: Building2 }
                    ].map(mode => (
                      <button 
                        key={mode.id} 
                        onClick={() => setCardSelectionMode(mode.id as any)}
                        className={`px-8 py-4 rounded-[2rem] text-xs font-black flex items-center gap-3 transition-all ${cardSelectionMode === mode.id ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         <mode.icon size={18}/>
                         {mode.label}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 <div className="lg:col-span-5 space-y-8">
                    {cardSelectionMode === 'individual' && (
                       <div className="space-y-3 animate-in fade-in">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">البحث والاختيار</label>
                          <div className="relative group">
                             <Search className="absolute right-4 top-4 text-slate-300" size={20}/>
                             <input 
                               type="text" 
                               placeholder="اكتب اسم الفرد المطلوب..." 
                               className="w-full pr-12 pl-6 py-5 bg-gray-50 dark:bg-slate-800 rounded-3xl outline-none font-black text-sm border-2 border-transparent focus:border-accent shadow-sm"
                               value={personSearchQuery}
                               onChange={e => setPersonSearchQuery(e.target.value)}
                             />
                             {searchedPersonnel.length > 0 && (
                               <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden">
                                  {searchedPersonnel.map(p => (
                                    <button key={p.id} onClick={() => { setTargetPersonId(p.id); setPersonSearchQuery(''); }} className="w-full text-right px-6 py-4 hover:bg-accent hover:text-white transition-all border-b dark:border-slate-800">
                                       <span className="font-black text-xs">{p.rank} / {p.name}</span>
                                    </button>
                                  ))}
                               </div>
                             )}
                          </div>
                          {targetPerson && (
                             <div className="p-6 bg-accent/5 rounded-[2rem] border-2 border-accent/20 flex items-center justify-between animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center font-black">{targetPerson.name[0]}</div>
                                   <div><p className="font-black text-sm">{targetPerson.name}</p><p className="text-[10px] text-slate-400 font-bold">{targetPerson.rank}</p></div>
                                </div>
                                <button onClick={() => setTargetPersonId('')} className="text-red-400 hover:text-red-600"><Trash2 size={20}/></button>
                             </div>
                          )}
                       </div>
                    )}

                    {cardSelectionMode === 'department' && (
                       <div className="space-y-3 animate-in fade-in">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">اختر الإدارة المطلوب إصدار بطاقات لها</label>
                          <select className="w-full p-6 bg-gray-50 dark:bg-slate-800 rounded-[2.5rem] outline-none font-black border-2 border-transparent focus:border-accent shadow-sm" value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}>
                             <option value="">-- اضغط للاختيار من القائمة --</option>
                             {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                       </div>
                    )}

                    {cardSelectionMode === 'group' && (
                       <div className="space-y-4 animate-in fade-in">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">حدد الأفراد المطلوبين</label>
                          <div className="max-h-96 overflow-y-auto custom-scrollbar border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-6 space-y-3 bg-slate-50/50">
                             {personnel.map(p => (
                                <button 
                                  key={p.id} 
                                  onClick={() => {
                                    const next = new Set(selectedGroupIds);
                                    if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                                    setSelectedGroupIds(next);
                                  }}
                                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${selectedGroupIds.has(p.id) ? 'bg-accent/10 text-accent border-accent/30 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-400 border-transparent hover:border-slate-200'}`}
                                >
                                   <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${selectedGroupIds.has(p.id) ? 'bg-accent animate-pulse' : 'bg-slate-200'}`}></div>
                                      <span className="text-xs font-black">{p.rank} / {p.name}</span>
                                   </div>
                                   {selectedGroupIds.has(p.id) && <CheckCircle2 size={18}/>}
                                </button>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>

                 <div className="lg:col-span-7 bg-slate-900 p-12 rounded-[4rem] text-white relative overflow-hidden flex flex-col items-center justify-center text-center space-y-8">
                    <ShieldCheck size={220} className="absolute -right-20 -bottom-20 text-white opacity-[0.03] rotate-12" />
                    <div className="w-24 h-24 bg-accent/20 rounded-full border-4 border-accent/10 shadow-inner flex items-center justify-center">
                       <Smartphone size={56} className="text-accent"/>
                    </div>
                    <div className="relative z-10">
                       <h4 className="text-4xl font-black">{peopleForCards.length} بطاقة ذكية</h4>
                       <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-[0.4em]">جاهزة للمُعالجة والطباعة</p>
                    </div>
                    <button 
                      disabled={peopleForCards.length === 0}
                      onClick={() => setIsCardPreviewOpen(true)}
                      className="w-full max-w-sm bg-accent text-white py-6 rounded-[2rem] font-black shadow-2xl shadow-accent/40 flex items-center justify-center gap-4 disabled:opacity-50 transition-all hover:scale-[1.05] active:scale-95 relative z-10"
                    >
                       <Printer size={24}/> توليد البطاقات الرقمية
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* PRINT MODAL: ID Cards Generation */}
      {isCardPreviewOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl overflow-y-auto no-print">
           <div className="bg-slate-100 dark:bg-slate-900 p-10 rounded-[4rem] w-full max-w-6xl shadow-2xl space-y-10 my-8 animate-in zoom-in-95">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-sm gap-8 border dark:border-slate-700">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-50 rounded-3xl text-emerald-600"><Printer size={32}/></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">تجهيز البطاقات الأمنية <span className="text-sm bg-slate-100 dark:bg-slate-700 px-4 py-1.5 rounded-full">{peopleForCards.length} بطاقة</span></h3>
                       <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">تحقق من التشفير والباركود قبل المباشرة بالطباعة النهائية.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')} className="bg-white dark:bg-slate-700 px-8 py-4 rounded-2xl shadow-sm hover:scale-105 transition-all text-accent font-black text-xs flex items-center gap-3 border-2 border-slate-100 dark:border-slate-600">
                       <ArrowLeftRight size={20}/> {cardSide === 'front' ? 'معاينة الوجه الخلفي' : 'معاينة الوجه الأمامي'}
                    </button>
                    <button onClick={() => window.print()} className="bg-slate-950 text-white px-12 py-4 rounded-2xl shadow-2xl hover:scale-105 transition-all font-black text-xs flex items-center gap-3 border border-accent/30">
                       <Printer size={20}/> طباعة كافة البطاقات
                    </button>
                    <button onClick={() => setIsCardPreviewOpen(false)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm hover:text-red-500 transition-all border dark:border-slate-700"><X size={28}/></button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 justify-items-center py-10 max-h-[70vh] overflow-y-auto custom-scrollbar px-10">
                 {peopleForCards.map(p => {
                    const isMilitary = p.type === PersonnelType.MILITARY;
                    return (
                       <div key={p.id} className={`relative w-[480px] h-[300px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-2 border-slate-200 text-slate-900 transition-all duration-700 transform ${cardSide === 'back' ? '[transform:rotateY(180deg)]' : ''}`}>
                           {/* Front Side */}
                           <div className={`absolute inset-0 flex flex-col p-10 [backface-visibility:hidden] ${cardSide === 'back' ? 'hidden' : 'block'}`}>
                              <div className="flex justify-between items-start mb-6">
                                 <div className="text-right">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.4em] mb-1">Secure ID Protocol</p>
                                    <h4 className={`text-[13px] font-black leading-tight uppercase ${isMilitary ? 'text-blue-900' : 'text-emerald-900'}`}>{settings.orgName}</h4>
                                 </div>
                                 <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center p-2 border shadow-inner">
                                    <img src={settings.logo} className="w-full h-full object-contain" />
                                 </div>
                              </div>
                              <div className="flex gap-8 items-start flex-1">
                                 <div className={`w-32 h-40 rounded-[2.5rem] border-2 overflow-hidden shadow-inner flex-shrink-0 relative group ${isMilitary ? 'bg-slate-100 border-blue-100' : 'bg-slate-100 border-emerald-100'}`}>
                                    {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full p-8 text-slate-200"/>}
                                    <div className={`absolute bottom-0 inset-x-0 h-2 ${isMilitary ? 'bg-blue-600' : 'bg-emerald-600'}`}></div>
                                 </div>
                                 <div className="flex-1 space-y-3 pt-1">
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 leading-none tracking-widest italic">الاسم بالكامل</p><p className="text-[14px] font-black text-slate-900 truncate leading-tight">{p.name}</p></div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <div><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 leading-none tracking-widest italic">الرتبة/الدرجة</p><p className={`text-[12px] font-black leading-none ${isMilitary ? 'text-blue-600' : 'text-emerald-600'}`}>{p.rank}</p></div>
                                       <div><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 leading-none tracking-widest italic">الرقم العام</p><p className="text-[12px] font-black font-mono leading-none tracking-tighter">#{p.militaryNumber || p.nationalId.slice(-6)}</p></div>
                                    </div>
                                    <div><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 leading-none tracking-widest italic">الإدارة / التمركز</p><p className="text-[11px] font-black truncate leading-none uppercase text-slate-700">{departments.find(d => d.id === p.departmentId)?.name || 'N/A'}</p></div>
                                    <div className="flex justify-between items-end mt-auto pt-3">
                                       <div><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 leading-none tracking-widest italic">فصيلة الدم</p><p className="text-[13px] font-black text-red-600 leading-none">{p.bloodType}</p></div>
                                       <div className="w-18 h-18 border-2 border-slate-100 rounded-2xl p-1 bg-white shadow-md">
                                          <img src={qrCodes[p.id] || ''} className="w-full h-full object-contain" />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="mt-5 pt-4 border-t-2 border-slate-100 flex justify-center bg-slate-50/50 -mx-10 -mb-10 py-3">
                                 <canvas id={`card-barcode-${p.id}`} className="max-w-[220px] h-10"></canvas>
                              </div>
                           </div>
                           {/* Back Side */}
                           <div className={`absolute inset-0 flex flex-col p-12 bg-slate-950 text-white items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)] ${cardSide === 'front' ? 'hidden' : 'block'}`}>
                              <img src={settings.logo} className="w-24 h-24 object-contain grayscale opacity-20 mb-8" />
                              <h5 className="text-[11px] font-black text-accent uppercase tracking-[0.6em] mb-6">Terms & Security Protocol</h5>
                              <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-10 italic">
                                 هذه البطاقة وثيقة رسمية وتعتبر ملكاً للجهة المصدرة ({settings.orgName}). يمنع تداولها أو استخدامها لغير الأغراض الرسمية. عند العثور على هذه البطاقة، يرجى تسليمها لأقرب وحدة أمنية فوراً.
                              </p>
                              <div className="mt-10 pt-8 border-t border-white/10 w-full flex items-center justify-center gap-4">
                                 <Shield size={24} className="text-accent opacity-40"/>
                                 <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">DCMI Security Center</p>
                                    <p className="text-[8px] font-bold text-slate-600 uppercase leading-none">Advanced Military Data Protocol</p>
                                 </div>
                              </div>
                           </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>
      )}

      {/* PRINT MODAL: Official Document Preview */}
      {isPreviewOpen && targetPerson && selectedDoc && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto no-print">
           <div className="bg-white rounded-[4rem] w-full max-w-4xl shadow-2xl relative animate-in slide-in-from-bottom-20 overflow-hidden my-8">
              <div className="p-16 space-y-16" id="printable-form">
                 <div className="flex justify-between items-start border-b-8 border-slate-900 pb-12">
                    <div className="text-right space-y-3">
                       <h1 className="text-3xl font-black text-slate-900">{settings.orgName}</h1>
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em]">Military HR - Records Division</p>
                       <p className="text-[10px] font-black text-slate-400 mt-6 tracking-widest">تاريخ الاستخراج: {new Date().toLocaleString('ar-EG')}</p>
                    </div>
                    <img src={settings.logo} className="w-28 h-28 object-contain" />
                 </div>

                 <div className="text-right space-y-8 text-xl font-bold leading-loose text-slate-800 px-10 min-h-[500px]">
                    {getDocumentContent()}
                 </div>

                 <div className="grid grid-cols-2 gap-20 pt-20 border-t-2 border-slate-100">
                    <div className="text-center space-y-12">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">توقيع مقدم الطلب</p>
                       <div className="h-0.5 w-full bg-slate-100"></div>
                       <p className="font-black text-lg">{targetPerson.name}</p>
                    </div>
                    <div className="text-center space-y-8">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">{selectedSignature}</p>
                       <div className="w-40 h-40 bg-slate-50 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center mx-auto opacity-30">
                          <Stamp size={80} className="text-slate-300"/>
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-between items-center pt-10 border-t text-[9px] text-slate-300 font-black italic uppercase tracking-[0.4em]">
                    <span>DCMI Official Document Security System</span>
                    {includeQr && <div className="p-2 border rounded-xl"><QrIcon size={32}/></div>}
                 </div>
              </div>

              <div className="p-10 bg-gray-50 border-t flex justify-end gap-3 no-print">
                 <button onClick={() => setIsPreviewOpen(false)} className="px-10 py-4 text-slate-400 font-black hover:text-slate-600 transition-colors">تراجع</button>
                 <button onClick={() => window.print()} className="bg-slate-950 text-white px-14 py-5 rounded-3xl font-black flex items-center gap-4 shadow-2xl hover:scale-105 transition-all">
                    <Printer size={24}/> طباعة المستند الموثق
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        @media print { 
          .no-print { display: none !important; } 
          #printable-form { margin: 0; padding: 40px; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default FormsManager;

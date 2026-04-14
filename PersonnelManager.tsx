
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Personnel, PersonnelType, User, AttendanceStatus, Department, Section, PersonnelAuditRecord } from '../types';
import { storage } from '../utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { BLOOD_TYPES, SUIT_SIZES, SHOE_SIZES, CONNECTION_TYPES, ID_TYPES } from '../constants';
import * as XLSX from 'xlsx';
import { useDebounce } from '../hooks/useDebounce';
import { 
  Search, Edit2, X, User as UserIcon, Image as ImageIcon, 
  Shield, Trash2, 
  Printer, CheckSquare, Square, Info,
  Star, History, Award, Briefcase, 
  Calendar, Download, UserPlus, ExternalLink,
  ChevronRight, TrendingUp, LayoutGrid,
  Filter as FilterIcon, RotateCcw, Smartphone, MapPin, 
  BadgeCheck, Fingerprint, FileSearch, ClipboardList,
  Building2, Workflow, UsersRound, Settings, Droplets,
  Activity, CreditCard, FileText
} from 'lucide-react';

interface PersonnelManagerProps {
  currentUser: User;
}

const PersonnelManager: React.FC<PersonnelManagerProps> = ({ currentUser }) => {
  const [personnel, setPersonnel] = useState<Personnel[]>(storage.getPersonnel());
  const [departments] = useState<Department[]>(storage.getDepartments());
  const [sections] = useState<Section[]>(storage.getSections());
  const [settings] = useState(storage.getSettings());
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'service' | 'logistics'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['photo', 'name', 'rank', 'dept', 'status', 'indicators']);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    blood: 'all',
    dept: 'all',
    section: 'all'
  });

  // Simulation for smooth loading removed for better performance
  useEffect(() => {
    // No longer needed
  }, [filters, debouncedSearchQuery]);

  const getPromotionInfo = (person: Personnel) => {
    if (!person.lastPromotionDate) return { eligible: false, remaining: 'غير محدد' };
    const last = new Date(person.lastPromotionDate);
    const next = new Date(last.getFullYear() + 4, last.getMonth(), last.getDate());
    const diff = next.getTime() - new Date().getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    return {
      eligible: diff <= 0,
      remaining: diff <= 0 ? 'مستحق حالياً' : `${years} سنة و ${months} شهر`
    };
  };

  const getServiceDuration = (joinDate?: string) => {
    if (!joinDate) return 'ط؛ظٹط± ظ…ط­ط¯ط¯';
    const start = new Date(joinDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    return `${years} ط³ظ†ط© ظˆ ${Math.abs(months)} ط´ظ‡ط±`;
  };

  const getServicePercentage = (joinDate?: string) => {
    if (!joinDate) return 0;
    const start = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.min(100, Math.round((diffYears / 40) * 100));
  };

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = useCallback(async (status: Personnel['status']) => {
    if (selectedIds.size === 0) return;
    const ok = window.confirm(`هل أنت متأكد من تغيير حالة ${selectedIds.size} فرد إلى [${status}]؟`);
    if (ok) {
      const updated = personnel.map(p => selectedIds.has(p.id) ? { ...p, status } : p);
      setPersonnel(updated);
      storage.setPersonnel(updated);
      setSelectedIds(new Set());
      storage.addLog({
        userId: currentUser.id,
        username: currentUser.username,
        action: 'تعديل حالة جماعي',
        details: `تم تغيير حالة ${selectedIds.size} فرد إلى ${status}`
      });
      showToast(`تم تغيير حالة ${selectedIds.size} فرد بنجاح`, 'success');
    }
  }, [selectedIds, personnel, currentUser, showToast]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const ok = window.confirm(`تحذير: هل أنت متأكد من حذف ${selectedIds.size} سجل نهائياً؟`);
    if (ok) {
      const updated = personnel.filter(p => !selectedIds.has(p.id));
      setPersonnel(updated);
      storage.setPersonnel(updated);
      setSelectedIds(new Set());
      storage.addLog({
        userId: currentUser.id,
        username: currentUser.username,
        action: 'حذف جماعي',
        details: `تم حذف ${selectedIds.size} سجل من المنظومة.`
      });
      showToast(`تم حذف ${selectedIds.size} سجل بنجاح`, 'success');
    }
  }, [selectedIds, personnel, currentUser, showToast]);

  const stats = useMemo(() => {
    let active = 0, retired = 0, military = 0, civilian = 0, eligibleForPromotion = 0;
    personnel.forEach(p => {
      if (p.status === 'active') active++;
      if (p.status === 'retired') retired++;
      if (p.type === PersonnelType.MILITARY) military++;
      if (p.type === PersonnelType.CIVILIAN) civilian++;
      if (getPromotionInfo(p).eligible) eligibleForPromotion++;
    });
    return {
      total: personnel.length,
      active,
      retired,
      military,
      civilian,
      eligibleForPromotion
    };
  }, [personnel]);

  const COLUMNS = [
    { id: 'photo', label: 'الصورة' },
    { id: 'name', label: 'الاسم الكامل' },
    { id: 'rank', label: 'الرتبة/الدرجة' },
    { id: 'dept', label: 'الإدارة/القسم' },
    { id: 'status', label: 'الحالة' },
    { id: 'indicators', label: 'المؤشرات' },
    { id: 'phone', label: 'الهاتف' },
    { id: 'joinDate', label: 'تاريخ الالتحاق' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormData: Omit<Personnel, 'id' | 'createdAt'> = {
    name: '',
    rank: settings.ranks[settings.ranks.length - 1] || 'ط¨ظ„ط§',
    militaryNumber: '',
    nationalId: '',
    idType: 'national',
    hasMilitaryNumber: true,
    rankAuthority: '',
    financialStatus: 'salary',
    connectionType: CONNECTION_TYPES[0],
    directSupervisor: 'commander',
    address: '',
    bloodType: BLOOD_TYPES[0],
    departmentId: departments[0]?.id || '',
    sectionId: '',
    entity: settings.entities[0] || '',
    employmentType: CONNECTION_TYPES[0],
    placementLocation: '',
    salaryEntity: settings.salaryEntities[0] || '',
    phone: '',
    emergencyPhone: '',
    uniformSize: SUIT_SIZES[0],
    shoeSize: SHOE_SIZES[0],
    type: PersonnelType.MILITARY,
    photo: '',
    status: 'active',
    attendanceStatus: 'present' as AttendanceStatus,
    isManager: false,
    qualification: '',
    specialization: '',
    birthDate: '',
    joinDate: new Date().toISOString().split('T')[0],
    lastPromotionDate: new Date().toISOString().split('T')[0],
    promotionHistory: [],
    movementHistory: [],
    auditHistory: [],
    gear: [],
    documents: [],
    commendations: [],
    disciplinaryRecords: [],
    customData: {}
  };

  const [formData, setFormData] = useState<Omit<Personnel, 'id' | 'createdAt'>>(initialFormData);

  // ظپظ„طھط±ط© ط§ظ„ط£ظ‚ط³ط§ظ… ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط®طھط§ط±ط© ظپظٹ ط§ظ„ظ†ظ…ظˆط°ط¬
  const availableSections = useMemo(() => {
    return sections.filter(s => s.departmentId === formData.departmentId);
  }, [sections, formData.departmentId]);

  // طھط­ط¯ظٹط« ط§ظ„ظ‚ط³ظ… ط¹ظ†ط¯ طھط؛ظٹظٹط± ط§ظ„ط¥ط¯ط§ط±ط© ظ„ط¶ظ…ط§ظ† ط§ظ„ط§طھط³ط§ظ‚
  const filteredList = useMemo(() => {
    const search = debouncedSearchQuery.toLowerCase();
    return personnel.filter(p => {
      const matchesSearch = !search || 
                            p.name.toLowerCase().includes(search) || 
                            p.militaryNumber.includes(search) || 
                            p.nationalId.includes(search) ||
                            p.rank.toLowerCase().includes(search);
      const matchesStatus = filters.status === 'all' || p.status === filters.status;
      const matchesType = filters.type === 'all' || p.type === filters.type;
      const matchesBlood = filters.blood === 'all' || p.bloodType === filters.blood;
      const matchesDept = filters.dept === 'all' || p.departmentId === filters.dept;
      const matchesSection = filters.section === 'all' || p.sectionId === filters.section;
      return matchesSearch && matchesStatus && matchesType && matchesBlood && matchesDept && matchesSection;
    }).sort((a, b) => {
      const idxA = settings.ranks.indexOf(a.rank);
      const idxB = settings.ranks.indexOf(b.rank);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [personnel, debouncedSearchQuery, filters, settings.ranks]);

  const TEMPLATE_HEADERS = [
    'الاسم الكامل', 'الرتبة', 'الرقم العسكري', 'الرقم الوطني', 'نوع الهوية',
    'جهة الرتبة', 'الوضع المالي', 'نوع التعيين', 'المسؤول المباشر', 'العنوان',
    'فصيلة الدم', 'الإدارة', 'القسم', 'الجهة', 'نوع الوظيفة',
    'مكان التنسيب', 'جهة المرتب', 'الهاتف', 'هاتف الطوارئ', 'مقاس البدلة',
    'مقاس الحذاء', 'نوع الفرد', 'مؤهل علمي', 'تخصص', 'تاريخ الميلاد'
  ];

  // Method 1: Download as XLSX using Data URI (most browser-compatible)
  const handleDownloadTemplate = useCallback(() => {
    try {
   // Method 2: Download as CSV with UTF-8 BOM (guaranteed to open in Excel with Arabic)
  const handleDownloadTemplateCSV = useCallback(() => {
    try {
      const bom = '\uFEFF';
      const csvContent = bom + TEMPLATE_HEADERS.join(',') + '\n';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'HR_Import_Template.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(link)) document.body.removeChild(link);
      }, 300);
    } catch (error) {
      console.error('CSV download error:', error);
      showToast('فشل تنزيل ملف القالب. يرجى المحاولة مرة أخرى.', 'error');
    }
  }, [showToast]);

  const handleImportExcel = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          showToast('الملف فارغ أو غير صالح.', 'error');
          return;
        }

        const newPersonnel: Personnel[] = [];
        let skipped = 0;
        let imported = 0;

        data.forEach(row => {
          const name = row['الاسم الكامل']?.toString().trim();
          const natId = row['الرقم الوطني']?.toString().trim();
          
          if (!name || !natId) {
            skipped++;
            return;
          }

          const isDup = personnel.some(p => p.nationalId === natId || (row['الرقم العسكري'] && p.militaryNumber === row['الرقم العسكري'].toString()));
          if (isDup) {
            skipped++;
            return;
          }

          const deptName = row['الإدارة']?.toString().trim();
          const sectionName = row['القسم']?.toString().trim();
          const dept = departments.find(d => d.name === deptName);
          const deptId = dept?.id || departments[0]?.id || '';
          const section = sections.find(s => s.name === sectionName && s.departmentId === deptId);
          const sectionId = section?.id || '';

          const person: Personnel = {
            id: crypto.randomUUID(),
            name,
            rank: row['الرتبة']?.toString().trim() || settings.ranks[settings.ranks.length - 1],
            militaryNumber: row['الرقم العسكري']?.toString().trim() || '',
            nationalId: natId,
            idType: (row['نوع الهوية']?.toString().includes('إداري') ? 'administrative' : 'national'),
            hasMilitaryNumber: !!row['الرقم العسكري'],
            rankAuthority: row['جهة الرتبة']?.toString().trim() || '',
            financialStatus: (row['الوضع المالي']?.toString().includes('بدون') ? 'no_salary' : 'salary'),
            connectionType: row['نوع التعيين']?.toString().trim() || CONNECTION_TYPES[0],
            directSupervisor: (row['المسؤول المباشر']?.toString().includes('قسم') ? 'head_section' : row['المسؤول المباشر']?.toString().includes('إدارة') ? 'head_dept' : 'commander'),
            address: row['العنوان']?.toString().trim() || '',
            bloodType: row['فصيلة الدم']?.toString().trim() || BLOOD_TYPES[0],
            departmentId: deptId,
            sectionId: sectionId,
            entity: row['الجهة']?.toString().trim() || settings.entities[0] || '',
            employmentType: row['نوع الوظيفة']?.toString().trim() || CONNECTION_TYPES[0],
            placementLocation: row['مكان التنسيب']?.toString().trim() || '',
            salaryEntity: row['جهة المرتب']?.toString().trim() || settings.salaryEntities[0] || '',
            phone: row['الهاتف']?.toString().trim() || '',
            emergencyPhone: row['هاتف الطوارئ']?.toString().trim() || '',
            uniformSize: row['مقاس البدلة']?.toString().trim() || SUIT_SIZES[0],
            shoeSize: row['مقاس الحذاء']?.toString().trim() || SHOE_SIZES[0],
            type: (row['نوع الفرد']?.toString().includes('مدني') ? PersonnelType.CIVILIAN : PersonnelType.MILITARY),
            status: 'active',
            attendanceStatus: 'present',
            isManager: false,
            createdAt: new Date().toISOString(),
            lastPromotionDate: new Date().toISOString().split('T')[0],
            joinDate: new Date().toISOString().split('T')[0],
            qualification: row['مؤهل علمي']?.toString().trim() || '',
            specialization: row['تخصص']?.toString().trim() || '',
            birthDate: row['تاريخ الميلاد']?.toString().trim() || '',
            promotionHistory: [],
            movementHistory: [],
            auditHistory: [{
              id: crypto.randomUUID(),
              userId: currentUser.id,
              username: currentUser.username,
              action: 'استيراد جماعي',
              changes: 'تمت إضافة الفرد عبر ملف اكسل.',
              timestamp: new Date().toISOString()
            }],
            gear: [],
            documents: [],
            commendations: [],
            disciplinaryRecords: [],
            customData: {}
          };
          newPersonnel.push(person);
          imported++;
        });

        if (newPersonnel.length > 0) {
          const updated = [...newPersonnel, ...personnel];
          setPersonnel(updated);
          storage.setPersonnel(updated);
          storage.addLog({
            userId: currentUser.id,
            username: currentUser.username,
            action: 'استيراد جماعي من اكسل',
            details: `تم استيراد ${imported} فرد بنجاح، وتخطي ${skipped} سجل (تكرار أو نقص بيانات)`
          });
          showToast(`تم الاستيراد بنجاح! عدد الناجحين: ${imported}، تم تخطي: ${skipped}`, 'success');
        } else {
          showToast(`لم يتم استيراد أي بيانات. تم تخطي ${skipped} سجل بسبب أخطاء أو تكرار.`, 'warning');
        }
      } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء قراءة الملف. تأكد من استخدام القالب الصحيح.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }, [personnel, departments, sections, settings, currentUser, showToast]);
��ظ„ظپ ط§ظƒط³ظ„.',
              timestamp: new Date().toISOString()
            }],
            gear: [],
            documents: [],
            commendations: [],
            disciplinaryRecords: [],
            customData: {}
          };

          newPersonnel.push(person);
          imported++;
        });

        if (newPersonnel.length > 0) {
          const updated = [...newPersonnel, ...personnel];
          setPersonnel(updated);
          storage.setPersonnel(updated);
          storage.addLog({
            userId: currentUser.id,
            username: currentUser.username,
            action: 'ط§ط³طھظٹط±ط§ط¯ ط¬ظ…ط§ط¹ظٹ ظ…ظ† ط§ظƒط³ظ„',
            details: `طھظ… ط§ط³طھظٹط±ط§ط¯ ${imported} ظپط±ط¯ ط¨ظ†ط¬ط§ط­طŒ ظˆطھط®ط·ظٹ ${skipped} ط³ط¬ظ„ (طھظƒط±ط§ط± ط£ظˆ ظ†ظ‚طµ ط¨ظٹط§ظ†ط§طھ)`
          });
          showToast(`تم الاستيراد بنجاح! عدد الناجحين: ${imported}، تم تخطي: ${skipped}`, 'success');
        } else {
          showToast(`لم يتم استيراد أي بيانات. تم تخطي ${skipped} سجل بسبب أخطاء أو تكرار.`, 'warning');
        }

      } catch (err) {
        console.error(err);
        showToast('حدث خطأ أثناء قراءة الملف. تأكد من استخدام القالب الصحيح.', 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  }, [personnel, departments, sections, settings, currentUser, showToast]);

  const handleExportExcel = useCallback(() => {
    const data = filteredList.map(p => ({
      'ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„': p.name,
      'ط§ظ„ط±طھط¨ط©/ط§ظ„ط¯ط±ط¬ط©': p.rank,
      'ط§ظ„ط±ظ‚ظ… ط§ظ„ط¹ط³ظƒط±ظٹ': p.militaryNumber,
      'ط§ظ„ط¥ط¯ط§ط±ط©': departments.find(d => d.id === p.departmentId)?.name || '---',
      'ط§ظ„ظ‚ط³ظ…': sections.find(s => s.id === p.sectionId)?.name || '---',
      'ط§ظ„ط­ط§ظ„ط©': p.status,
      'طھط§ط±ظٹط® ط§ظ„ط§ظ„طھط­ط§ظ‚': p.joinDate
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personnel_List");
    XLSX.writeFile(wb, `DCMI_Personnel_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredList, departments, sections]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.idType === 'national') {
      if (formData.nationalId.length !== 12) {
        const msg = formData.nationalId.length < 12 ? 'الرقم الوطني أقل من الحد (12 رقماً)' : 'الرقم الوطني فوق الحد (12 رقماً)';
        showToast(msg, 'error');
        return;
      }
    }

    // Uniqueness check for national/administrative ID
    if (!storage.isNationalIdUnique(formData.nationalId, editingPerson?.id)) {
      showToast('رقم الهوية موجود مسبقاً في قاعدة البيانات، يرجى التحقق من الرقم.', 'error');
      return;
    }

    // Uniqueness check for military number
    if (formData.hasMilitaryNumber && formData.militaryNumber && formData.militaryNumber !== 'بلا') {
      if (!storage.isMilitaryNumberUnique(formData.militaryNumber, editingPerson?.id)) {
        showToast('الرقم العسكري موجود مسبقاً في قاعدة البيانات، يرجى التحقق من الرقم.', 'error');
        return;
      }
    }

    let auditEntry: PersonnelAuditRecord | null = null;
    if (editingPerson) {
      const changes: string[] = [];
      if (editingPerson.rank !== formData.rank) changes.push(`الرتبة: من [${editingPerson.rank}] إلى [${formData.rank}]`);
      if (editingPerson.departmentId !== formData.departmentId) {
        const oldDept = departments.find(d => d.id === editingPerson.departmentId)?.name;
        const newDept = departments.find(d => d.id === formData.departmentId)?.name;
        changes.push(`الإدارة: من [${oldDept || '---'}] إلى [${newDept || '---'}]`);
      }
      if (editingPerson.sectionId !== formData.sectionId) {
        const oldSec = sections.find(s => s.id === editingPerson.sectionId)?.name;
        const newSec = sections.find(s => s.id === formData.sectionId)?.name;
        changes.push(`القسم: من [${oldSec || '---'}] إلى [${newSec || '---'}]`);
      }
      if (changes.length > 0) {
        auditEntry = {
          id: crypto.randomUUID(),
          userId: currentUser.id,
          username: currentUser.username,
          action: 'تعديل سجل الفرد',
          changes: changes.join(' | '),
          timestamp: new Date().toISOString()
        };
      }
    } else {
       auditEntry = {
          id: crypto.randomUUID(),
          userId: currentUser.id,
          username: currentUser.username,
          action: 'إنشاء ملف رقمي جديد',
          changes: 'تمت إضافة الفرد للمنظومة لأول مرة.',
          timestamp: new Date().toISOString()
       };
    }

    const entryData = {
      ...formData,
      id: editingPerson ? editingPerson.id : crypto.randomUUID(),
      createdAt: editingPerson ? editingPerson.createdAt : new Date().toISOString(),
      lastEditedBy: currentUser.username,
      lastEditedAt: new Date().toISOString(),
      auditHistory: editingPerson 
        ? (auditEntry ? [auditEntry, ...(editingPerson.auditHistory || [])] : (editingPerson.auditHistory || []))
        : [auditEntry]
    };

    const updatedList = editingPerson 
      ? personnel.map(p => p.id === editingPerson.id ? entryData : p)
      : [entryData, ...personnel];

    setPersonnel(updatedList);
    storage.setPersonnel(updatedList);
    storage.addLog({
      userId: currentUser.id,
      username: currentUser.username,
      action: editingPerson ? 'تعديل بيانات فرد' : 'إضافة فرد جديد',
      details: `${editingPerson ? 'تعديل' : 'إضافة'} الفرد: ${formData.name} (${formData.rank})`
    });
    showToast(editingPerson ? `تم تحديث بيانات ${formData.name} بنجاح` : `تمت إضافة ${formData.name} للمنظومة بنجاح`, 'success');

    setIsModalOpen(false);
    setEditingPerson(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) {
      const updated = personnel.filter(p => p.id !== id);
      setPersonnel(updated);
      storage.setPersonnel(updated);
      if (selectedPersonnel?.id === id) setSelectedPersonnel(null);
      showToast('تم حذف السجل بنجاح', 'success');
    }
  };

  return (
    <div className="relative flex flex-col h-full space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 0. Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
         {[
            { label: 'إجمالي القوة', value: stats.total, icon: UsersRound, color: 'bg-blue-500' },
            { label: 'نشط حالياً', value: stats.active, icon: BadgeCheck, color: 'bg-emerald-500' },
            { label: 'مستحق ترقية', value: stats.eligibleForPromotion, icon: TrendingUp, color: 'bg-amber-500' },
            { label: 'عسكريين', value: stats.military, icon: Shield, color: 'bg-slate-700' },
            { label: 'مدنيين', value: stats.civilian, icon: UserIcon, color: 'bg-indigo-500' },
            { label: 'متقاعدين', value: stats.retired, icon: History, color: 'bg-red-500' },
         ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-2 group hover:scale-105 transition-all">
               <div className={`p-3 rounded-2xl text-white ${stat.color} shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                  <stat.icon size={20}/>
               </div>
               <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{stat.label}</p>
               <h4 className="text-2xl font-black dark:text-white">{stat.value}</h4>
            </div>
         ))}
      </div>

      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] shadow-sm border dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 flex-1 w-full">
           <div className="relative flex-1 w-full group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 group-focus-within:text-accent transition-colors" size={18}/>
              <input 
                type="text" placeholder="البحث الذكي..." 
                className="w-full pr-12 pl-6 py-3.5 bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-accent dark:border-slate-700 rounded-2xl md:rounded-3xl outline-none font-black text-sm transition-all"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 sm:flex-none p-3.5 rounded-xl md:rounded-2xl border transition-all ${showFilters ? 'bg-accent text-white border-accent shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
              >
                 <FilterIcon size={18}/>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowColumnConfig(!showColumnConfig)}
                  className={`flex-1 sm:flex-none p-3.5 rounded-xl md:rounded-2xl border transition-all ${showColumnConfig ? 'bg-accent text-white border-accent shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                   <Settings size={18}/>
                </button>
                {showColumnConfig && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border dark:border-slate-800 p-6 z-[100] animate-in zoom-in-95">
                     <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase mb-4 tracking-widest">تخصيص الأعمدة</p>
                     <div className="space-y-3">
                        {COLUMNS.map(col => (
                           <button 
                             key={col.id} 
                             onClick={() => toggleColumn(col.id)}
                             className="flex items-center gap-3 w-full text-right group"
                           >
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${visibleColumns.includes(col.id) ? 'bg-accent border-accent text-white' : 'border-slate-200 dark:border-slate-700'}`}>
                                 {visibleColumns.includes(col.id) && <CheckSquare size={14}/>}
                              </div>
                              <span className={`text-xs font-bold ${visibleColumns.includes(col.id) ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{col.label}</span>
                           </button>
                        ))}
                     </div>
                  </div>
                )}
              </div>
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700">
                 <button 
                   onClick={() => setViewMode('table')}
                   className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-accent shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                 >
                    <ClipboardList size={18}/>
                 </button>
                 <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-accent shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                 >
                    <LayoutGrid size={18}/>
                 </button>
              </div>
           </div>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
           {selectedIds.size > 0 && (
             <div className="flex gap-2 animate-in slide-in-from-left-4">
                <button onClick={() => handleBulkStatusChange('active')} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100">طھظ†ط´ظٹط·</button>
                <button onClick={handleBulkDelete} className="p-3 bg-red-50 text-red-500 rounded-xl border border-red-100"><Trash2 size={18}/></button>
             </div>
           )}
           <div className="flex gap-2">
              <button 
                onClick={handleDownloadTemplate} 
                title="طھط­ظ…ظٹظ„ ظ†ظ…ظˆط°ط¬ ط§ظ„ط¥ط¯ط®ط§ظ„"
                className="p-3.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl md:rounded-2xl border border-blue-100 dark:border-blue-900/40 hover:scale-105 transition-all shadow-sm flex items-center gap-2"
              >
                 <Download size={18}/>
                 <span className="hidden xl:inline text-[10px] font-black">طھط­ظ…ظٹظ„ ط§ظ„ظ‚ط§ظ„ط¨</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                title="ط§ط³طھظٹط±ط§ط¯ ظ…ظ† ط§ظƒط³ظ„"
                className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl md:rounded-2xl border border-emerald-100 dark:border-emerald-900/40 hover:scale-105 transition-all shadow-sm flex items-center gap-2"
              >
                 <FileText size={18}/>
                 <span className="hidden xl:inline text-[10px] font-black">ط§ط³طھظٹط±ط§ط¯ ط¬ظ…ط§ط¹ظٹ</span>
              </button>
           </div>
           
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept=".xlsx, .xls, .csv" 
             onChange={handleImportExcel}
           />

           <button onClick={handleExportExcel} className="p-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-xl md:rounded-2xl border dark:border-slate-700 hover:scale-105 transition-all shadow-sm">
              <Download size={18}/>
           </button>
           <button 
             onClick={() => { setEditingPerson(null); setFormData(initialFormData); setActiveFormTab('personal'); setIsModalOpen(true); }}
             className="flex-1 lg:flex-none bg-accent text-white px-6 md:px-10 py-3.5 rounded-xl md:rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl shadow-accent/20 hover:scale-105 transition-all text-sm"
           >
              <UserPlus size={20} /> ط¥ط¶ط§ظپط© ظپط±ط¯
           </button>
        </div>
      </div>

      {/* 2. Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border dark:border-slate-800 grid grid-cols-1 md:grid-cols-5 gap-6 animate-in slide-in-from-top-4">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">ط§ظ„ط­ط§ظ„ط©</label>
              <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                 <option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>
                 <option value="active">ظ†ط´ط·</option>
                 <option value="retired">ظ…طھظ‚ط§ط¹ط¯</option>
                 <option value="dropped">ظ…ظ†ظ‚ط·ط¹</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">ط§ظ„ط¥ط¯ط§ط±ط©</label>
              <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm" value={filters.dept} onChange={e => setFilters({...filters, dept: e.target.value, section: 'all'})}>
                 <option value="all">ظƒظ„ ط§ظ„ط¥ط¯ط§ط±ط§طھ</option>
                 {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">ط§ظ„ظ‚ط³ظ…</label>
              <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm" value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})} disabled={filters.dept === 'all'}>
                 <option value="all">ظƒظ„ ط§ظ„ط£ظ‚ط³ط§ظ…</option>
                 {sections.filter(s => s.departmentId === filters.dept).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest px-2">ظپطµظٹظ„ط© ط§ظ„ط¯ظ…</label>
              <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-sm" value={filters.blood} onChange={e => setFilters({...filters, blood: e.target.value})}>
                 <option value="all">ط§ظ„ظƒظ„</option>
                 {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
           </div>
           <div className="flex items-end">
              <button onClick={() => setFilters({status:'all', type:'all', blood:'all', dept:'all', section: 'all'})} className="w-full p-4 text-red-500 font-black text-xs flex items-center justify-center gap-2 hover:bg-red-50 rounded-2xl transition-all">
                 <RotateCcw size={16}/> ظ…ط³ط­ ط§ظ„ظپظ„ط§طھط±
              </button>
           </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-500 opacity-100">
        {filteredList.length === 0 ? (
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3.5rem] border dark:border-slate-800 flex flex-col items-center justify-center p-20 text-center space-y-6 animate-in zoom-in-95">
             <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                <FileSearch size={64}/>
             </div>
             <div>
                <h3 className="text-2xl font-black dark:text-white">ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ ظ…ط·ط§ط¨ظ‚ط©</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold mt-2">ط¬ط±ط¨ طھط؛ظٹظٹط± ظ…ط¹ط§ظٹظٹط± ط§ظ„ط¨ط­ط« ط£ظˆ ط§ظ„ظپظ„ط§طھط± ط§ظ„ظ…ط®طھط§ط±ط© ظ„ظ„ظˆطµظˆظ„ ظ„ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©.</p>
             </div>
             <button 
               onClick={() => { setSearchQuery(''); setFilters({ status: 'all', type: 'all', blood: 'all', dept: 'all', section: 'all' }); }}
               className="px-8 py-4 bg-accent text-white rounded-2xl font-black text-sm shadow-xl shadow-accent/20 hover:scale-105 transition-all"
             >
                ط¥ط¹ط§ط¯ط© ط¶ط¨ط· ط§ظ„ط¨ط­ط«
             </button>
          </div>
        ) : viewMode === 'table' ? (
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[3.5rem] border dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-slate-500 font-black text-[10px] uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-6 text-center w-14">
                    <button onClick={() => {
                      if (selectedIds.size === filteredList.length) setSelectedIds(new Set());
                      else setSelectedIds(new Set(filteredList.map(p => p.id)));
                    }} className="text-accent">
                      {selectedIds.size === filteredList.length && filteredList.length > 0 ? <CheckSquare size={20}/> : <Square size={20}/>}
                    </button>
                  </th>
                  {visibleColumns.includes('photo') && <th className="px-8 py-6">ط§ظ„طµظˆط±ط©</th>}
                  {visibleColumns.includes('name') && <th className="px-8 py-6">ط§ظ„ط§ط³ظ… ظˆط§ظ„ط¨ظٹط§ظ†ط§طھ</th>}
                  {visibleColumns.includes('rank') && <th className="px-8 py-6">ط§ظ„ط±طھط¨ط©</th>}
                  {visibleColumns.includes('dept') && <th className="px-8 py-6">ط§ظ„ط¥ط¯ط§ط±ط©/ط§ظ„ظ‚ط³ظ…</th>}
                  {visibleColumns.includes('indicators') && <th className="px-8 py-6">ط§ظ„ظ…ط¤ط´ط±ط§طھ</th>}
                  {visibleColumns.includes('status') && <th className="px-8 py-6">ط§ظ„ط­ط§ظ„ط©</th>}
                  {visibleColumns.includes('phone') && <th className="px-8 py-6">ط§ظ„ظ‡ط§طھظپ</th>}
                  {visibleColumns.includes('joinDate') && <th className="px-8 py-6">طھط§ط±ظٹط® ط§ظ„ط§ظ„طھط­ط§ظ‚</th>}
                  <th className="px-8 py-6 text-center">ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                <AnimatePresence mode="popLayout">
                  {filteredList.map((p, index) => {
                    const prom = getPromotionInfo(p);
                    const dept = departments.find(d => d.id === p.departmentId);
                    const sec = sections.find(s => s.id === p.sectionId);
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={`hover:bg-accent/5 transition-all group ${selectedPersonnel?.id === p.id ? 'bg-accent/5 border-r-4 border-accent' : ''} ${selectedIds.has(p.id) ? 'bg-accent/5' : ''}`}
                      >
                        <td className="px-6 py-6 text-center">
                          <button onClick={() => {
                            const next = new Set(selectedIds);
                            if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                            setSelectedIds(next);
                          }} className={selectedIds.has(p.id) ? 'text-accent' : 'text-slate-300'}>
                            {selectedIds.has(p.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                          </button>
                        </td>
                        {visibleColumns.includes('photo') && (
                          <td className="px-8 py-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                               {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-3 text-slate-300"/>}
                            </div>
                          </td>
                        )}
                        {visibleColumns.includes('name') && (
                          <td className="px-8 py-4 cursor-pointer" onClick={() => { setSelectedPersonnel(p); setIsProfileOpen(true); }}>
                             <div>
                                <p className="font-black dark:text-white text-base leading-tight flex items-center gap-2">
                                   {p.name}
                                   {p.isManager && <Star size={14} className="text-amber-500 fill-amber-500"/>}
                                </p>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-black mt-1 uppercase tracking-tighter">#{p.militaryNumber || p.nationalId}</p>
                             </div>
                          </td>
                        )}
                        {visibleColumns.includes('rank') && (
                          <td className="px-8 py-4">
                             <p className="font-black text-accent text-base">{p.rank}</p>
                          </td>
                        )}
                        {visibleColumns.includes('dept') && (
                          <td className="px-8 py-4">
                             <p className="text-[10px] font-bold text-slate-500 uppercase">{dept?.name || 'ط¨ط¯ظˆظ† ط¥ط¯ط§ط±ط©'} / {sec?.name || 'ط¨ط¯ظˆظ† ظ‚ط³ظ…'}</p>
                          </td>
                        )}
                        {visibleColumns.includes('indicators') && (
                          <td className="px-8 py-4">
                             <div className="flex flex-col gap-2">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black w-fit ${prom.eligible ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-slate-600 dark:text-slate-400'}`}>
                                   <TrendingUp size={10}/>
                                   {prom.remaining}
                                </div>
                                <div className="flex items-center gap-2">
                                   <div className="h-1.5 w-20 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-accent" style={{width: '60%'}}></div>
                                   </div>
                                   <span className="text-[9px] font-black text-slate-600 dark:text-slate-400">{getServiceDuration(p.joinDate)}</span>
                                </div>
                             </div>
                          </td>
                        )}
                        {visibleColumns.includes('status') && (
                          <td className="px-8 py-4">
                             <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                                p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                p.status === 'retired' ? 'bg-amber-100 text-amber-700' : 
                                p.status === 'dropped' ? 'bg-red-100 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-700'
                             }`}>
                                {p.status === 'active' ? 'ظ†ط´ط·' : 
                                 p.status === 'retired' ? 'ظ…طھظ‚ط§ط¹ط¯' : 
                                 p.status === 'dropped' ? 'ظ…ظ†ظ‚ط·ط¹' : 
                                 p.status === 'mission' ? 'ظپظٹ ظ…ظ‡ظ…ط©' : 'ط£ط®ط±ظ‰'}
                             </span>
                          </td>
                        )}
                        {visibleColumns.includes('phone') && (
                          <td className="px-8 py-4">
                             <p className="font-mono font-bold text-slate-500">{p.phone || '---'}</p>
                          </td>
                        )}
                        {visibleColumns.includes('joinDate') && (
                          <td className="px-8 py-4">
                             <p className="text-xs font-bold text-slate-500">{p.joinDate}</p>
                          </td>
                        )}
                        <td className="px-8 py-4 text-center">
                           <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setEditingPerson(p); setFormData(p); setIsModalOpen(true); }} className="p-2.5 bg-gray-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-accent rounded-xl shadow-sm transition-all"><Edit2 size={18}/></button>
                              <button onClick={() => { setSelectedPersonnel(p); setIsProfileOpen(true); }} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white shadow-sm transition-all"><ExternalLink size={18}/></button>
                              <button onClick={() => handleDelete(p.id)} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-sm transition-all"><Trash2 size={18}/></button>
                           </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           <AnimatePresence>
             {filteredList.map((p, index) => {
                const dept = departments.find(d => d.id === p.departmentId);
                return (
                   <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                   >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[4rem] -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                    <div className="flex items-start justify-between relative z-10">
                       <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 overflow-hidden shadow-md">
                          {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <UserIcon size={32} className="m-6 text-slate-300"/>}
                       </div>
                       <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                             {p.status === 'active' ? 'ظ†ط´ط·' : 'ظ…ظ†ظ‚ط·ط¹'}
                          </span>
                          <button onClick={() => {
                            const next = new Set(selectedIds);
                            if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                            setSelectedIds(next);
                          }} className={selectedIds.has(p.id) ? 'text-accent' : 'text-slate-200'}>
                            {selectedIds.has(p.id) ? <CheckSquare size={24}/> : <Square size={24}/>}
                          </button>
                       </div>
                    </div>
                    <div className="mt-6 space-y-1 relative z-10">
                       <h4 className="font-black text-lg dark:text-white truncate">{p.name}</h4>
                       <p className="text-accent font-black text-sm">{p.rank}</p>
                       <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate">{dept?.name || 'ط¨ط¯ظˆظ† ط¥ط¯ط§ط±ط©'}</p>
                    </div>
                    <div className="mt-6 pt-6 border-t dark:border-slate-800 flex justify-between items-center relative z-10">
                       <div className="flex -space-x-2 rtl:space-x-reverse">
                          <button onClick={() => { setEditingPerson(p); setFormData(p); setIsModalOpen(true); }} className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-accent rounded-full border-2 border-white dark:border-slate-700 flex items-center justify-center transition-all"><Edit2 size={16}/></button>
                          <button onClick={() => { setSelectedPersonnel(p); setIsProfileOpen(true); }} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full border-2 border-white dark:border-slate-700 flex items-center justify-center transition-all"><ExternalLink size={16}/></button>
                       </div>
                       <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">#{p.militaryNumber}</p>
                    </div>
                 </motion.div>
              );
           })}
           </AnimatePresence>
        </div>
      )}
      </div>

      {/* 4. Profile Detail Drawer */}
      {isProfileOpen && selectedPersonnel && (
        <div className="fixed inset-0 z-[500] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-white dark:bg-slate-950 h-full shadow-2xl animate-in slide-in-from-left duration-500 overflow-y-auto custom-scrollbar">
              <div className="relative h-64 bg-slate-900 overflow-hidden">
                 <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950"></div>
                    <img src={selectedPersonnel.photo || 'https://picsum.photos/seed/military/800/400'} className="w-full h-full object-cover blur-sm" />
                 </div>
                 <button onClick={() => setIsProfileOpen(false)} className="absolute top-8 left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all"><X size={24}/></button>
                 <div className="absolute -bottom-12 right-12 flex items-end gap-6">
                    <div className="w-40 h-40 rounded-[3rem] border-8 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-2xl">
                       {selectedPersonnel.photo ? <img src={selectedPersonnel.photo} className="w-full h-full object-cover" /> : <UserIcon size={64} className="m-10 text-slate-300"/>}
                    </div>
                    <div className="pb-14">
                       <h2 className="text-3xl font-black text-white drop-shadow-lg">{selectedPersonnel.name}</h2>
                       <p className="text-accent font-black text-lg">{selectedPersonnel.rank}</p>
                    </div>
                 </div>
              </div>

              <div className="mt-20 px-12 pb-24 space-y-12">
                 <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 text-center">
                       <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase mb-1">ط§ظ„ط±ظ‚ظ… ط§ظ„ط¹ط³ظƒط±ظٹ</p>
                       <p className="font-black text-lg dark:text-white">{selectedPersonnel.militaryNumber}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 text-center">
                       <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase mb-1">ظپطµظٹظ„ط© ط§ظ„ط¯ظ…</p>
                       <p className="font-black text-lg text-red-500">{selectedPersonnel.bloodType}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 text-center">
                       <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase mb-1">ط³ظ†ظˆط§طھ ط§ظ„ط®ط¯ظ…ط©</p>
                       <p className="font-black text-lg dark:text-white">{getServiceDuration(selectedPersonnel.joinDate).split(' ')[0]}</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-3 border-b dark:border-slate-800 pb-4">
                       <Info className="text-accent" size={24}/> ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط©
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                       {[
                          { label: 'ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط·ظ†ظٹ', value: selectedPersonnel.nationalId, icon: Fingerprint },
                          { label: 'طھط§ط±ظٹط® ط§ظ„ظ…ظٹظ„ط§ط¯', value: selectedPersonnel.birthDate || '---', icon: Calendar },
                          { label: 'ط§ظ„ط¥ط¯ط§ط±ط©', value: departments.find(d => d.id === selectedPersonnel.departmentId)?.name || '---', icon: Building2 },
                          { label: 'ط§ظ„ظ‚ط³ظ…', value: sections.find(s => s.id === selectedPersonnel.sectionId)?.name || '---', icon: Workflow },
                          { label: 'ط§ظ„ظ…ط¤ظ‡ظ„ ط§ظ„ط¹ظ„ظ…ظٹ', value: selectedPersonnel.qualification || '---', icon: Award },
                          { label: 'ط§ظ„طھط®طµطµ', value: selectedPersonnel.specialization || '---', icon: Star },
                          { label: 'ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ', value: selectedPersonnel.phone, icon: Smartphone },
                          { label: 'ط§ظ„ط¹ظ†ظˆط§ظ†', value: selectedPersonnel.address, icon: MapPin },
                       ].map((item, i) => (
                          <div key={i} className="flex items-center gap-4">
                             <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-400"><item.icon size={18}/></div>
                             <div>
                                <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">{item.label}</p>
                                <p className="font-bold dark:text-slate-200">{item.value}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-3 border-b dark:border-slate-800 pb-4">
                       <History className="text-accent" size={24}/> ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ (Audit Log)
                    </h3>
                    <div className="space-y-4">
                       {(selectedPersonnel.auditHistory || []).length > 0 ? (
                          selectedPersonnel.auditHistory?.map((log, i) => (
                             <div key={i} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 relative">
                                <div className="flex justify-between items-start mb-2">
                                   <p className="font-black text-sm text-accent">{log.action}</p>
                                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed">{log.changes}</p>
                                <div className="mt-3 pt-3 border-t dark:border-slate-800 flex items-center gap-2 text-[10px] font-black text-slate-600 dark:text-slate-400">
                                   <UserIcon size={12}/> ط¨ظˆط§ط³ط·ط©: {log.username}
                                </div>
                             </div>
                          ))
                       ) : (
                          <div className="text-center py-12 text-slate-300 italic font-black">ظ„ط§ طھظˆط¬ط¯ ط³ط¬ظ„ط§طھ ط³ط§ط¨ظ‚ط© ظ„ظ‡ط°ط§ ط§ظ„ظپط±ط¯.</div>
                       )}
                    </div>
                 </div>

                 <div className="flex gap-4 pt-8">
                    <button onClick={() => { setEditingPerson(selectedPersonnel); setFormData(selectedPersonnel); setIsModalOpen(true); }} className="flex-1 py-5 bg-accent text-white rounded-[2rem] font-black shadow-xl shadow-accent/20 flex items-center justify-center gap-3"><Edit2 size={20}/> طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظ„ظپ</button>
                    <button onClick={() => window.print()} className="px-8 py-5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black"><Printer size={20}/></button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 4. Add/Edit Personnel Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm"
          >
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden border dark:border-slate-800 flex flex-col max-h-[85vh] relative"
             >
                {/* Modal Header & Step Indicator */}
                <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                          <Fingerprint size={24}/>
                       </div>
                       <div>
                          <h3 className="text-xl font-black dark:text-white">{editingPerson ? 'طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ظپط±ط¯' : 'ط¥ط¶ط§ظپط© ظپط±ط¯ ط¬ط¯ظٹط¯'}</h3>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">ظٹط±ط¬ظ‰ ط§ط³طھظƒظ…ط§ظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ط¯ظ‚ط©</p>
                       </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all text-slate-600 dark:text-slate-400 hover:text-red-500"><X/></button>
                 </div>

                 {/* Horizontal Steps */}
                 <div className="flex items-center justify-between relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0"></div>
                    {[
                       { id: 'personal', label: 'ط§ظ„ط´ط®طµظٹط©', icon: UserIcon },
                       { id: 'service', label: 'ط§ظ„ظˆط¸ظٹظپظٹط©', icon: Shield },
                       { id: 'logistics', label: 'ط§ظ„ظ„ظˆط¬ط³طھظٹط©', icon: Briefcase },
                    ].map((tab, idx) => {
                       const isActive = activeFormTab === tab.id;
                       const isPast = ['personal', 'service', 'logistics'].indexOf(activeFormTab) > idx;
                       return (
                          <button 
                            key={tab.id}
                            onClick={() => setActiveFormTab(tab.id as any)}
                            className="relative z-10 flex flex-col items-center gap-2 group"
                          >
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-4 ${
                                isActive ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30 scale-110' : 
                                isPast ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                             }`}>
                                {isPast ? <CheckSquare size={16}/> : <tab.icon size={16}/>}
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-accent' : 'text-slate-600 dark:text-slate-400'}`}>{tab.label}</span>
                          </button>
                       );
                    })}
                 </div>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-hidden flex flex-col">
                 <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                    {activeFormTab === 'personal' && (
                       <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                             <div className="relative group">
                                <div 
                                  onClick={() => fileInputRef.current?.click()} 
                                  className="w-40 h-40 rounded-[3rem] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 hover:text-accent transition-all cursor-pointer overflow-hidden group"
                                >
                                   {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : (
                                      <div className="flex flex-col items-center">
                                         <ImageIcon size={32} className="mb-2 opacity-50 group-hover:scale-110 transition-transform"/>
                                         <span className="text-[10px] font-black uppercase">ط±ظپط¹ طµظˆط±ط©</span>
                                      </div>
                                   )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-accent text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Edit2 size={14}/>
                                </div>
                             </div>
                             
                             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="space-y-1 md:col-span-2">
                                   <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><UserIcon size={12}/> ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„ (ط¥ط¬ط¨ط§ط±ظٹ)</label>
                                   <input required type="text" placeholder="ط£ط¯ط®ظ„ ط§ظ„ط§ط³ظ… ط§ظ„ط±ط¨ط§ط¹ظٹ..." className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Fingerprint size={12}/> ظ†ظˆط¹ ط§ظ„ظ‡ظˆظٹط©</label>
                                   <select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.idType} onChange={e => setFormData({...formData, idType: e.target.value as any})}>
                                      {ID_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                                   </select>
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><FileSearch size={12}/> {formData.idType === 'national' ? 'ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط·ظ†ظٹ (12 ط±ظ‚ظ…ط§ظ‹)' : 'ط§ظ„ط±ظ‚ظ… ط§ظ„ط¥ط¯ط§ط±ظٹ'}</label>
                                   <input required type="text" className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-mono font-bold text-slate-900 dark:text-white transition-all" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder={formData.idType === 'national' ? '000000000000' : 'ط£ط¯ط®ظ„ ط§ظ„ط±ظ‚ظ… ط§ظ„ط¥ط¯ط§ط±ظٹ'} />
                                </div>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Smartphone size={12}/> ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</label><input type="number" className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-mono font-bold text-slate-900 dark:text-white transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Smartphone size={12}/> ظ‡ط§طھظپ ط§ظ„ط·ظˆط§ط±ط¦</label><input type="number" className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-mono font-bold text-slate-900 dark:text-white transition-all" value={formData.emergencyPhone} onChange={e => setFormData({...formData, emergencyPhone: e.target.value})} /></div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Calendar size={12}/> طھط§ط±ظٹط® ط§ظ„ظ…ظٹظ„ط§ط¯</label><input type="date" className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Droplets size={12}/> ظپطµظٹظ„ط© ط§ظ„ط¯ظ…</label><select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})}>{BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}</select></div>
                             <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><MapPin size={12}/> ط§ظ„ط¹ظ†ظˆط§ظ† ط¨ط§ظ„طھظپطµظٹظ„</label><input type="text" className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                          </div>
                       </div>
                    )}

                    {activeFormTab === 'service' && (
                       <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Award size={12}/> ط§ظ„ط±طھط¨ط© / ط§ظ„ط¯ط±ط¬ط©</label>
                                <select 
                                   className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" 
                                   value={formData.rank} 
                                   onChange={e => {
                                      const rank = e.target.value;
                                      setFormData(prev => ({
                                         ...prev, 
                                         rank,
                                         militaryNumber: (rank === 'ط¨ظ„ط§' || prev.type === PersonnelType.CIVILIAN) ? 'ط¨ظ„ط§' : (prev.militaryNumber === 'ط¨ظ„ط§' ? '' : prev.militaryNumber)
                                      }));
                                   }}
                                >
                                   {settings.ranks.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Building2 size={12}/> ط§ظ„ط¥ط¯ط§ط±ط© / ط§ظ„ظˆط­ط¯ط©</label><select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value, sectionId: ''})}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Workflow size={12}/> ط§ظ„ظ‚ط³ظ… ط§ظ„ط¯ط§ط®ظ„ظٹ</label><select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value})} disabled={!formData.departmentId}><option value="">-- ط§ط®طھط± ط§ظ„ظ‚ط³ظ… --</option>{availableSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Shield size={12}/> ط§ظ„ط±ظ‚ظ… ط§ظ„ط¹ط³ظƒط±ظٹ</label>
                                <input 
                                   type="text" 
                                   disabled={formData.rank === 'ط¨ظ„ط§' || formData.type === PersonnelType.CIVILIAN}
                                   className={`w-full p-4 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-mono font-bold transition-all ${
                                      (formData.rank === 'ط¨ظ„ط§' || formData.type === PersonnelType.CIVILIAN)
                                         ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed opacity-60' 
                                         : 'bg-gray-50 dark:bg-slate-800/50 text-slate-900 dark:text-white'
                                   }`}
                                   value={formData.militaryNumber} 
                                   onChange={e => setFormData({...formData, militaryNumber: e.target.value})} 
                                />
                             </div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Activity size={12}/> ط§ظ„ط­ط§ظ„ط© ط§ظ„ظˆط¸ظٹظپظٹط©</label><select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="active">ظ†ط´ط·</option><option value="retired">ظ…طھظ‚ط§ط¹ط¯</option><option value="mission">ظپظٹ ظ…ظ‡ظ…ط©</option><option value="resigned">ظ…ط³طھظ‚ظٹظ„</option><option value="dropped">ظ…ظ†ظ‚ط·ط¹</option></select></div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><ClipboardList size={12}/> ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ</label>
                                <select 
                                   className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" 
                                   value={formData.type} 
                                   onChange={e => {
                                      const type = e.target.value as any;
                                      setFormData(prev => ({
                                         ...prev, 
                                         type,
                                         militaryNumber: (prev.rank === 'ط¨ظ„ط§' || type === PersonnelType.CIVILIAN) ? 'ط¨ظ„ط§' : (prev.militaryNumber === 'ط¨ظ„ط§' ? '' : prev.militaryNumber)
                                      }));
                                   }}
                                >
                                   <option value={PersonnelType.MILITARY}>ط¹ط³ظƒط±ظٹ</option>
                                   <option value={PersonnelType.CIVILIAN}>ظ…ظˆط¸ظپ ظ…ط¯ظ†ظٹ</option>
                                </select>
                             </div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><ExternalLink size={12}/> ط¬ظ‡ط© ط§ظ„ط§ظ„طھط­ط§ظ‚</label><select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.entity} onChange={e => setFormData({...formData, entity: e.target.value})}>{settings.entities.map(en => <option key={en} value={en}>{en}</option>)}</select></div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><CreditCard size={12}/> ط¬ظ‡ط© طھظ‚ط§ط¶ظٹ ط§ظ„ط±ط§طھط¨</label><select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.salaryEntity} onChange={e => setFormData({...formData, salaryEntity: e.target.value})}>{settings.salaryEntities.map(se => <option key={se} value={se}>{se}</option>)}</select></div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><FileText size={12}/> ظ†ظˆط¹ ط§ظ„طھط¹ط§ظ‚ط¯</label><select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})}>{CONNECTION_TYPES.map(et => <option key={et} value={et}>{et}</option>)}</select></div>
                          </div>
                          {/* طھظ… ظ†ظ‚ظ„ ط­ظ‚ظˆظ„ ط§ظ„طھظˆط§ط±ظٹط® ط¥ظ„ظ‰ ظ‚ط³ظ… ط§ظ„طھط±ظ‚ظٹط§طھ ظ„طھط¨ط³ظٹط· ط§ظ„ط¥ط¯ط®ط§ظ„ */}
                       </div>
                    )}

                    {activeFormTab === 'logistics' && (
                       <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Briefcase size={12}/> ظ…ظ‚ط§ط³ ط§ظ„ط²ظٹ (Uniform Size)</label>
                                <select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.uniformSize} onChange={e => setFormData({...formData, uniformSize: e.target.value})}>
                                   <option value="">-- ط§ط®طھط± ط§ظ„ظ…ظ‚ط§ط³ --</option>
                                   {SUIT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><Briefcase size={12}/> ظ…ظ‚ط§ط³ ط§ظ„ط­ط°ط§ط، (Shoe Size)</label>
                                <select className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.shoeSize} onChange={e => setFormData({...formData, shoeSize: e.target.value})}>
                                   <option value="">-- ط§ط®طھط± ط§ظ„ظ…ظ‚ط§ط³ --</option>
                                   {SHOE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase px-2 flex items-center gap-2"><MapPin size={12}/> ظ…ظˆظ‚ط¹ ط§ظ„ط®ط¯ظ…ط© ط§ظ„ط­ط§ظ„ظٹ</label>
                                <input type="text" placeholder="ط§ط³ظ… ط§ظ„ط«ظƒظ†ط© ط£ظˆ ط§ظ„ظ…ظˆظ‚ط¹ ط§ظ„ظ…ظٹط¯ط§ظ†ظٹ..." className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-accent dark:border-slate-700 outline-none font-bold text-slate-900 dark:text-white transition-all" value={formData.placementLocation} onChange={e => setFormData({...formData, placementLocation: e.target.value})} />
                             </div>
                          </div>
                       </div>
                    )}

                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setFormData({...formData, photo: ev.target?.result as string});
                          reader.readAsDataURL(file);
                       }
                    }} />
                 </form>

                 <div className="p-8 border-t dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-4">
                       <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-accent transition-all duration-500" style={{width: `${(['personal', 'service', 'logistics'].indexOf(activeFormTab) + 1) * 33.33}%`}}></div>
                       </div>
                       <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">ط§ظƒطھظ…ط§ظ„ ط§ظ„ظ…ظ„ظپ</span>
                    </div>

                    <div className="flex gap-3">
                       <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-800 transition-colors">ط¥ظ„ط؛ط§ط،</button>
                       {activeFormTab !== 'personal' && (
                         <button onClick={() => {
                           if (activeFormTab === 'service') setActiveFormTab('personal');
                           if (activeFormTab === 'logistics') setActiveFormTab('service');
                         }} className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 transition-all">ط§ظ„ط³ط§ط¨ظ‚</button>
                       )}
                       {activeFormTab !== 'logistics' ? (
                          <button 
                            type="button"
                            onClick={() => {
                               if (activeFormTab === 'personal') setActiveFormTab('service');
                               else if (activeFormTab === 'service') setActiveFormTab('logistics');
                            }} 
                            className="px-12 py-4 bg-accent text-white rounded-[2rem] font-black shadow-xl shadow-accent/20 hover:scale-105 transition-all flex items-center gap-2"
                          >
                            ط§ظ„طھط§ظ„ظٹ <ChevronRight size={18} className="rotate-180"/>
                          </button>
                       ) : (
                          <button onClick={handleSubmit} className="px-12 py-4 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2">
                             <BadgeCheck size={20}/> {editingPerson ? 'طھط­ط¯ظٹط« ط§ظ„ط³ط¬ظ„' : 'طھط£ظƒظٹط¯ ط§ظ„ط­ظپط¸'}
                          </button>
                       )}
                    </div>
                 </div>
              </div>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        @media print { .page-break-after { page-break-after: always; } .no-print { display: none !important; } }
      `}</style>
    </div>
  );
};

export default PersonnelManager;


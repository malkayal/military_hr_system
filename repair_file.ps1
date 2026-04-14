$path = "c:\Users\Mohammed Alkayal\Downloads\military_hr_system\components\PersonnelManager.tsx"
$content = Get-Content $path -Raw

# This is a VERY specific replacement to fix the syntax error I introduced.
# I will find the block from 'TEMPLATE_HEADERS' to 'handleSubmit' and replace it.

$startMarker = "  const TEMPLATE_HEADERS ="
$endMarker = "  const handleSubmit ="

$startIndex = $content.IndexOf($startMarker)
$endIndex = $content.IndexOf($endMarker)

if ($startIndex -ge 0 -and $endIndex -gt $startIndex) {
    $before = $content.Substring(0, $startIndex)
    $after = $content.Substring($endIndex)
    
    $middle = @"
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
      const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const dataUri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64;
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = 'HR_Import_Template.xlsx';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); }, 300);
    } catch (error) {
      console.error('XLSX download error:', error);
      alert('فشل تنزيل ملف Excel. جرّب زر تنزيل CSV بدلاً عنه.');
    }
  }, []);

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
      alert('فشل تنزيل ملف القالب. يرجى المحاولة مرة أخرى.');
    }
  }, []);

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
          alert('الملف فارغ أو غير صالح.');
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
            details: ``تم استيراد `$imported` فرد بنجاح، وتخطي `$skipped` سجل (تكرار أو نقص بيانات)``
          });
          alert(``تم الاستيراد بنجاح! ✅\nعدد الناجحين: `$imported` \nعدد الذين تم تخطيهم: `$skipped```);
        } else {
          alert(``لم يتم استيراد أي بيانات. تم تخطي `$skipped` سجل بسبب أخطاء أو تكرار.``);
        }
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء قراءة الملف. تأكد من استخدام القالب الصحيح.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }, [personnel, departments, sections, settings, currentUser]);

  const handleExportExcel = useCallback(() => {
    const data = filteredList.map(p => ({
      'الاسم الكامل': p.name,
      'الرتبة/الدرجة': p.rank,
      'الرقم العسكري': p.militaryNumber,
      'الإدارة': departments.find(d => d.id === p.departmentId)?.name || '---',
      'القسم': sections.find(s => s.id === p.sectionId)?.name || '---',
      'الحالة': p.status,
      'تاريخ الالتحاق': p.joinDate
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personnel_List");
    XLSX.writeFile(wb, ``DCMI_Personnel_`$(Get-Date -Format "yyyy-MM-dd")`.xlsx``);
  }, [filteredList, departments, sections]);

"@
    
    $finalContent = $before + $middle + "`n`n" + $after
    [System.IO.File]::WriteAllText($path, $finalContent, [System.Text.Encoding]::UTF8)
    Write-Host "SUCCESS: File repaired."
} else {
    Write-Host "ERROR: Markers not found."
}

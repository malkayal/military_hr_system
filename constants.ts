
export const RANKS = [
  'مشير',
  'فريق أول',
  'فريق',
  'لواء',
  'عميد',
  'عقيد',
  'مقدم',
  'رائد',
  'نقيب',
  'ملازم أول',
  'ملازم',
  'رئيس عرفاء',
  'عريف',
  'نائب عريف',
  'موظف',
  'بلا'
];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const SUIT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export const SHOE_SIZES = Array.from({ length: 16 }, (_, i) => (i + 35).toString());

export const CONNECTION_TYPES = ['تنسيب', 'تعيين', 'متعاون', 'ندب', 'عقد'];

export const FINANCIAL_STATUSES = [
  { id: 'salary', label: 'يتقاضى راتب' },
  { id: 'no_salary', label: 'لا يتقاضى راتب' }
];

export const ID_TYPES = [
  { id: 'national', label: 'رقم وطني' },
  { id: 'administrative', label: 'رقم إداري' }
];

export const SUPERVISOR_TYPES = [
  { id: 'commander', label: 'آمر الإدارة' },
  { id: 'head_dept', label: 'رئيس الإدارة' },
  { id: 'head_section', label: 'رئيس القسم' }
];

export const LEAVE_TYPES = ['إجازة سنوية', 'إجازة مرضية', 'إذن خروج', 'إجازة اضطرارية'];

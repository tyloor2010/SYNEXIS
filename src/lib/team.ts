/**
 * بيانات فريق SYNEXIS — عدّلها أنت بحرية.
 * كل عضو له:
 * - id: يُستخدم في اسم ملف الصورة في public/team/<id>.svg
 * - name / nameAr: الاسم اللاتيني والعربي
 * - roleAr: الدور (اختياري — اتركه فارغًا ولا تعرض شيئًا)
 * - github / linkedin / website: روابط حساباته (اتركها فارغة ولن تُعرض)
 *
 * استبدل الصورة بصورة حقيقية للعضو بوضع ملف باسم public/team/<id>.svg
 * (أو غيّر الحقل image أدناه لأي مسار صورة آخر).
 */

export type TeamMember = {
  id: string;
  name: string;
  nameAr: string;
  roleAr: string;
  github: string;
  linkedin: string;
  website: string;
  image?: string;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'mohammed-al-sayyad',
    name: 'Mohammed Al-Sayyad',
    nameAr: 'محمد الصياد',
    roleAr: '',
    github: '',
    linkedin: '',
    website: '',
    image: '/team/mohammed-al-sayyad.svg',
  },
  {
    id: 'samar-moharam',
    name: 'Samar Moharam',
    nameAr: 'سمر محرم',
    roleAr: '',
    github: '',
    linkedin: '',
    website: '',
    image: '/team/samar-moharam.svg',
  },
  {
    id: 'ahmed-ibrahimd',
    name: 'Ahmed Ibrahimd',
    nameAr: 'أحمد إبراهيم',
    roleAr: '',
    github: '',
    linkedin: '',
    website: '',
    image: '/team/ahmed-ibrahimd.svg',
  },
  {
    id: 'ahmed-mohammed',
    name: 'Ahmed Mohammed',
    nameAr: 'أحمد محمد',
    roleAr: '',
    github: '',
    linkedin: '',
    website: '',
    image: '/team/ahmed-mohammed.svg',
  },
  {
    id: 'mohammed-nasser',
    name: 'Mohammed Nasser',
    nameAr: 'محمد ناصر',
    roleAr: '',
    github: '',
    linkedin: '',
    website: 'https://moonasser.site/',
    image: '/team/mohammed-nasser.svg',
  },
];

export const TEAM_NOTE =
  'روابط وحسابات كل عضو قيد الإضافة — عدّل src/lib/team.ts واستبدل الصورة في public/team/.';

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
    roleAr: 'Leader - Sysadmin',
    github: 'http://github.com/moiegy',
    linkedin: '',
    website: '',
    image: '/team/Mohammed_Al-Sayyad.jpeg',
  },
  {
    id: 'samar-moharam',
    name: 'Samar Moharam',
    nameAr: 'سمر محرم',
    roleAr: 'Presenter',
    github: '',
    linkedin: '',
    website: 'https://www.facebook.com/share/1FYY2P2As4/',
    image: '/team/Samar.jpeg',
  },
  {
    id: 'ahmed-ibrahimd',
    name: 'Ahmed Ibrahim',
    nameAr: 'أحمد إبراهيم',
    roleAr: 'Video Editing',
    github: '',
    linkedin: '',
    website: '',
    image: '/team/ahmed-ibrahimd.jpeg',
  },
  {
    id: 'ahmed-mohammed',
    name: 'Ahmed Mohammed',
    nameAr: 'أحمد محمد',
    roleAr: 'Researcher',
    github: '',
    linkedin: '',
    website: 'https://www.facebook.com/share/1FVehnsNKF/',
    image: '/team/ENG_Ahmed.jpeg',
  },
  {
    id: 'mohammed-nasser',
    name: 'Mohammed Nasser',
    nameAr: 'محمد ناصر',
    roleAr: 'UI/UX Frontend Devloper',
    github: '',
    linkedin: '',
    website: 'https://moonasser.site/',
    image: '/team/mohammed-nasser.jpeg',
  },
];

export const TEAM_NOTE =
  'روابط وحسابات كل عضو قيد الإضافة — بيانات الفريق قابلة للتعديل، وصور الأعضاء قابلة للاستبدال.';

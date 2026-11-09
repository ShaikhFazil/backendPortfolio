const { z } = require('zod');

const str = (max = 500) => z.string().trim().max(max);
const optStr = (max = 500) => z.string().trim().max(max).optional().or(z.literal(''));
const urlish = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === '' || /^https?:\/\//i.test(v) || v.startsWith('/'), {
    message: 'Must be a http(s) URL',
  })
  .optional()
  .or(z.literal(''));

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const idParam = z.object({ id: z.string().min(1).max(120) });

/* ---------------- auth ---------------- */
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(10, 'New password must be at least 10 characters')
    .max(200)
    .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), {
      message: 'New password must contain letters and a number',
    }),
});

/* ---------------- profile ---------------- */
const socialSchema = z.object({
  label: str(60),
  url: z.string().trim().url(),
  icon: optStr(60),
});

const profileSchema = z.object({
  name: str(120).min(1),
  title: str(200).min(1),
  tagline: optStr(300),
  summary: optStr(2000),
  bio: optStr(8000),
  email: z.string().trim().toLowerCase().email().or(z.literal('')).optional(),
  phone: optStr(40),
  location: optStr(160),
  availability: optStr(160),
  yearsOfExperience: z.coerce.number().min(0).max(80).optional(),
  socials: z.array(socialSchema).max(10).optional(),
});

/* ---------------- skills ---------------- */
const CATEGORIES = [
  'Languages', 'Frontend', 'Backend', 'Databases',
  'State Management & APIs', 'AI, LLMs & Generative AI', 'DevOps & Tools',
];

const skillSchema = z.object({
  name: str(80).min(1),
  category: z.enum(CATEGORIES),
  level: z.coerce.number().min(0).max(100).optional(),
  iconUrl: urlish,
  iconPublicId: optStr(200),
  featured: z.coerce.boolean().optional(),
  order: z.coerce.number().optional(),
  published: z.coerce.boolean().optional(),
});

/* ---------------- experience ---------------- */
const experienceSchema = z.object({
  company: str(160).min(1),
  role: str(160).min(1),
  location: optStr(160),
  employmentType: optStr(60),
  startDate: str(40).min(1),
  endDate: optStr(40),
  current: z.coerce.boolean().optional(),
  description: optStr(2000),
  achievements: z.array(str(500)).max(20).optional(),
  technologies: z.array(str(60)).max(40).optional(),
  companyLogo: z.object({ url: optStr(2000), publicId: optStr(200) }).partial().optional(),
  companyUrl: urlish,
  order: z.coerce.number().optional(),
  published: z.coerce.boolean().optional(),
});

/* ---------------- projects ---------------- */
const projectSchema = z.object({
  title: str(160).min(1),
  slug: optStr(80),
  summary: optStr(400),
  description: optStr(8000),
  category: optStr(80),
  technologies: z.array(str(60)).max(40).optional(),
  features: z.array(str(300)).max(30).optional(),
  thumbnail: z.object({ url: optStr(2000), publicId: optStr(200) }).partial().optional(),
  images: z
    .array(z.object({ url: z.string().trim().min(1).max(2000), publicId: optStr(200), alt: optStr(200) }))
    .max(12)
    .optional(),
  liveUrl: urlish,
  githubUrl: urlish,
  featured: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  order: z.coerce.number().optional(),
  year: optStr(20),
});

/* ---------------- education / certifications ---------------- */
const educationSchema = z.object({
  institution: str(200).min(1),
  qualification: str(200).min(1),
  field: optStr(160),
  startYear: optStr(20),
  endYear: optStr(20),
  grade: optStr(60),
  description: optStr(2000),
  order: z.coerce.number().optional(),
  published: z.coerce.boolean().optional(),
});

const certificationSchema = z.object({
  name: str(200).min(1),
  issuer: optStr(160),
  issueDate: optStr(40),
  credentialId: optStr(160),
  credentialUrl: urlish,
  kind: z.enum(['certification', 'achievement']).optional(),
  order: z.coerce.number().optional(),
  published: z.coerce.boolean().optional(),
});

/* ---------------- contact ---------------- */
const contactSchema = z.object({
  name: str(120).min(2, 'Please enter your name'),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  subject: optStr(200),
  message: str(5000).min(10, 'Message must be at least 10 characters'),
  // honeypot: must stay empty
  website: z.literal('').optional(),
});

const messageUpdateSchema = z.object({
  read: z.coerce.boolean().optional(),
  archived: z.coerce.boolean().optional(),
});

/* ---------------- shared ---------------- */
const reorderSchema = z.object({
  items: z
    .array(z.object({ id: objectId, order: z.coerce.number() }))
    .min(1)
    .max(200),
});

const deleteAssetSchema = z.object({
  publicId: str(300).min(1),
  resourceType: z.enum(['image', 'raw', 'video']).optional(),
});

module.exports = {
  idParam,
  loginSchema,
  changePasswordSchema,
  profileSchema,
  skillSchema,
  experienceSchema,
  projectSchema,
  educationSchema,
  certificationSchema,
  contactSchema,
  messageUpdateSchema,
  reorderSchema,
  deleteAssetSchema,
  CATEGORIES,
};

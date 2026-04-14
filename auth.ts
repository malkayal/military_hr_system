import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * تشفير كلمة المرور باستخدام bcryptjs
 * @param password كلمة المرور النصية
 * @returns كلمة المرور المشفرة
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * التحقق من مطابقة كلمة المرور النصية مع المشفرة
 * @param password كلمة المرور النصية
 * @param hashed كلمة المرور المشفرة
 * @returns true إذا كانت متطابقة
 */
export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashed);
};

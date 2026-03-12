/**
 * 开发模式 OTP 绕过：当 DEV_BYPASS_OTP=true 且 NODE_ENV=development 时，
 * 允许使用测试手机号 + 任意 6 位验证码通过，避免卡在短信配置。
 * 生产环境必须禁用。
 */
export const DEV_BYPASS_OTP =
  process.env.DEV_BYPASS_OTP === "true" && process.env.NODE_ENV === "development";

/** 测试用固定 userId（开发模式绕过时使用） */
export const DEV_BYPASS_USER_ID = "00000000-0000-0000-0000-000000000001";

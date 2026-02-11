export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Application constants
export const APP_NAME = "AutoMarket AI";
export const APP_DESCRIPTION = "Marketplace Inteligente de Veículos";

// Simple redirect to login page (no OAuth needed - using Supabase Auth)
export const getLoginUrl = () => '/login';

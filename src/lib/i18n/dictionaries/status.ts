import type { Locale } from "@/lib/i18n/config";

/**
 * Minimal localized strings for status surfaces — 404, loading, error
 * (Roadmap Task 7.2 / PERF-M2).
 *
 * Single source of truth for these strings. The full per-locale dictionaries
 * spread from here, and the small CLIENT status components (segment 404,
 * loading, error) import this module directly instead of `getDictionary`.
 *
 * Why: `error.tsx`, `not-found.tsx`, and `loading.tsx` are Client Components.
 * Importing `getDictionary` pulled the *entire* dictionary module (every locale,
 * every section) into each of those client chunks. This minimal module keeps
 * their client payload to a few dozen strings, while the dictionaries stay the
 * server-side source for everything else.
 */
export interface NotFoundStrings {
  eyebrow: string;
  title: string;
  message: string;
  home: string;
  secondary: string;
}

export interface LoadingStrings {
  label: string;
}

export interface ErrorStrings {
  title: string;
  message: string;
  retry: string;
  home: string;
}

export interface StatusStrings {
  notFound: NotFoundStrings;
  loading: LoadingStrings;
  error: ErrorStrings;
}

export const statusStrings: Record<Locale, StatusStrings> = {
  en: {
    notFound: {
      eyebrow: "404",
      title: "Page not found",
      message:
        "The page you are looking for does not exist or may have been moved. Return to the homepage or explore our products.",
      home: "Back to Home",
      secondary: "View Products",
    },
    loading: { label: "Loading" },
    error: {
      title: "Something went wrong",
      message:
        "An unexpected error occurred. Please try again, or return to the homepage.",
      retry: "Try again",
      home: "Back to Home",
    },
  },
  fa: {
    notFound: {
      eyebrow: "۴۰۴",
      title: "صفحه پیدا نشد",
      message:
        "صفحه‌ای که به دنبال آن هستید وجود ندارد یا ممکن است جابه‌جا شده باشد. به صفحه اصلی بازگردید یا محصولات ما را مشاهده کنید.",
      home: "بازگشت به خانه",
      secondary: "مشاهده محصولات",
    },
    loading: { label: "در حال بارگذاری" },
    error: {
      title: "خطایی رخ داد",
      message:
        "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید یا به صفحه اصلی بازگردید.",
      retry: "تلاش مجدد",
      home: "بازگشت به خانه",
    },
  },
  ru: {
    notFound: {
      eyebrow: "404",
      title: "Страница не найдена",
      message:
        "Страница, которую вы ищете, не существует или была перемещена. Вернитесь на главную или посмотрите нашу продукцию.",
      home: "Вернуться на главную",
      secondary: "Продукция",
    },
    loading: { label: "Загрузка" },
    error: {
      title: "Что-то пошло не так",
      message:
        "Произошла непредвиденная ошибка. Попробуйте ещё раз или вернитесь на главную.",
      retry: "Попробовать снова",
      home: "Вернуться на главную",
    },
  },
  vi: {
    notFound: {
      eyebrow: "404",
      title: "Không tìm thấy trang",
      message:
        "Trang bạn đang tìm không tồn tại hoặc có thể đã được di chuyển. Vui lòng quay về trang chủ hoặc xem các sản phẩm của chúng tôi.",
      home: "Về trang chủ",
      secondary: "Xem sản phẩm",
    },
    loading: { label: "Đang tải" },
    error: {
      title: "Đã có lỗi xảy ra",
      message:
        "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc quay về trang chủ.",
      retry: "Thử lại",
      home: "Về trang chủ",
    },
  },
};

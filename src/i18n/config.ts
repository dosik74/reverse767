import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const storedLng = typeof window !== 'undefined' ? localStorage.getItem('lng') : null;

const resources = {
  ru: {
    translation: {
      nav: {
        movies: 'Фильмы',
        series: 'Сериалы',
        games: 'Игры',
        music: 'Музыка',
        books: 'Книги',
        profile: 'Профиль',
        signOut: 'Выйти',
        notifications: 'Уведомления',
        messages: 'Сообщения',
      },
      index: {
        heroTitle: 'Reverse',
        heroSubtitle: 'Персональный трекер и рекомендации',
        searchPlaceholder: 'Поиск фильмов, сериалов, игр...'
      },
      movies: {
        explore: 'Исследуйте фильмы',
        searchPlaceholder: 'Поиск фильмов...',
        noResults: 'Ничего не найдено',
        loadMore: 'Показать ещё'
      }
    }
  },
  kk: {
    translation: {
      nav: {
        movies: 'Фильмдер',
        series: 'Сериалдар',
        games: 'Ойындар',
        music: 'Музыка',
        books: 'Кітаптар',
        profile: 'Профиль',
        signOut: 'Шығу',
        notifications: 'Хабарландырулар',
        messages: 'Хабарламалар',
      },
      index: {
        heroTitle: 'Reverse',
        heroSubtitle: 'Жеке трекер және ұсыныстар',
        searchPlaceholder: 'Фильмдер, сериалдар, ойындар іздеу...'
      },
      movies: {
        explore: 'Фильмдерді зерттеңіз',
        searchPlaceholder: 'Фильмдерді іздеу...',
        noResults: 'Ештеңе табылмады',
        loadMore: 'Тағы көрсету'
      }
    }
  },
  en: {
    translation: {
      nav: {
        movies: 'Movies',
        series: 'Series',
        games: 'Games',
        music: 'Music',
        books: 'Books',
        profile: 'Profile',
        signOut: 'Sign Out',
        notifications: 'Notifications',
        messages: 'Messages',
      },
      index: {
        heroTitle: 'Reverse',
        heroSubtitle: 'Your personal tracking and recommendations',
        searchPlaceholder: 'Search movies, series, games...'
      },
      movies: {
        explore: 'Explore Movies',
        searchPlaceholder: 'Search movies...',
        noResults: 'No movies found',
        loadMore: 'Load more'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLng || 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

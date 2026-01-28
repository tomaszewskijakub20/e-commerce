# E-commerce Frontend – Praca Inżynierska

**Autor:** Jakub Tomaszewski
**Technologie:** React, Vite, Tailwind CSS, React Router, Axios, Context API

---

## 📘 Opis projektu

Projekt stanowi frontendową część platformy **E-commerce z dynamicznymi atrybutami produktów**. Jest to aplikacja typu SPA (Single Page Application) napisana w React, która komunikuje się z dedykowanym API (backendem) w celu zarządzania i prezentacji danych.

Aplikacja implementuje **uwierzytelnianie oparte na tokenach JWT** oraz **autoryzację opartą na rolach** (użytkownik, `ROLE_OWNER`) z wykorzystaniem tras chronionych (`Protected Routes`). Komunikacja z API odbywa się poprzez centralny moduł **Axios** z interceptorami, które automatycznie zarządzają nagłówkami autoryzacyjnymi oraz obsługą wygaśnięcia sesji.

---

## ✨ Główne Funkcjonalności

Aplikacja podzielona jest na dwie główne strefy: publiczną (sklep) oraz chronioną (panel administracyjny).

### Panel Administracyjny (`ROLE_OWNER`)

Panel dostępny jest wyłącznie dla użytkowników z rolą `ROLE_OWNER`. Obejmuje pełen zakres operacji CRUD (Create, Read, Update, Delete) na kluczowych zasobach sklepu.

* **Moduł Kategorii:** Pełne operacje CRUD, zarządzanie hierarchią i statusami.
* **Moduł Atrybutów:** Dynamiczne definiowanie atrybutów dla kategorii z pełnym CRUD na definicjach.
* **Moduł Produktów:**
    * Zaawansowana edycja i dodawanie produktów.
    * **Dynamiczne Atrybuty Produktu:** Automatyczne renderowanie pól do wypełniania wartościami atrybutów na podstawie wybranej kategorii.
* **Zarządzanie Mediami:** Wysyłanie wielu zdjęć, ustawianie miniaturki  i zarządzanie tekstem alternatywnym.
* **Moduł CMS i Ustawienia:** Zarządzanie stronami statycznymi (Regulamin, O nas), konfiguracja danych sklepu (logo, kontakt, social media) oraz edytor treści (Quill).
* **Statystyki i Zamówienia:** Wizualizacja danych sprzedażowych oraz procesowanie zamówień.

### Strefa Użytkownika i Publiczna

* **Uwierzytelnianie i Rejestracja:** Pełny proces logowania, rejestracji oraz resetowania hasła. Rejestracja wymaga aktywacji konta przez link e-mail.
* **Koszyk i Checkout:** Lokalny stan koszyka , proces składania zamówienia z wyborem adresu i metody płatności.
* **Katalog Publiczny:** Przeglądanie produktów, filtrowanie po kategoriach oraz szczegółowy widok produktu.
* **Asystent AI:** Zintegrowany czatbot  wspomagający użytkownika w nawigacji i wyborze produktów.
* **CMS Viewer:** Dynamiczne wyświetlanie stron informacyjnych stworzonych w panelu admina.

---

## 🛠️ Architektura Uwierzytelniania

Aplikacja wykorzystuje przepływ oparty na `AuthContext` i interceptorach Axios, aby zapewnić płynne i bezpieczne zarządzanie sesją.

1.  **Logowanie:** Token JWT jest zapisywany w `localStorage`.
2.  **`AuthContext`:** Zarządza stanem (`user`, `isAuthenticated`) i weryfikuje token przy starcie (`GET /api/auth/me`).
3.  **Interceptor Axios (Request):** Przed *każdym* żądaniem, automatycznie dodaje token do nagłówka `Authorization: Bearer <token>`.
4.  **Interceptor Axios (Response):** W przypadku błędu `401 Unauthorized` (wygasły token), automatycznie usuwa token i przekierowuje użytkownika do `/login`.

---

## ⚙️ Użyte technologie

| Technologia | Zastosowanie |
| :--- | :--- |
| **React, Vite** | Budowa i narzędzia deweloperskie dla SPA. |
| **Tailwind CSS** | Framework CSS do szybkiego, responsywnego stylowania. |
| **React Router** | Obsługa tras, nawigacji i tras chronionych. |
| **Axios** | Klient HTTP z globalnym zarządzaniem tokenami (Interceptory). |
| **Context API** | Globalne zarządzanie stanem (Auth, Cart). |
| **React Quill** | Edytor tekstu WYSIWYG dla modułu CMS. |
| **Lucide Icons** | Zestaw ikon SVG. |

---

## 🚀 Uruchomienie projektu lokalnie

### 1. Klonowanie repozytorium

```bash
git clone [https://github.com/tomaszewskijakub20/e-commerce.git](https://github.com/tomaszewskijakub20/e-commerce.git)
cd e-commerce
```

### 2. Instalacja zależności

```bash
npm install
```

### 3. Konfiguracja zmiennych środowiskowych

Utwórz plik `.env` w głównym katalogu projektu (możesz skopiować `.env.example`) i uzupełnij adres URL swojego backendu:

```
VITE_API_URL=http://localhost:8080/api
```

### 4. Uruchomienie aplikacji

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:5173` (lub innym wolnym porcie).

---

## 🧩 Struktura projektu

Struktura została podzielona logicznie na moduły odpowiadające za widoki, logikę biznesową oraz komponenty współdzielone.

```
src/
├── 📁 assets/              # Zasoby statyczne (pliki graficzne, ikony SVG)
│
├── 📁 components/          # Globalne komponenty interfejsu
│   └── 📁 routes/          # Komponenty strażników tras zarządzające dostępem
│
├── 📁 context/             # Globalne zarządzanie stanem aplikacji (Context API)
│   # Zawiera logikę sesji użytkownika (Auth) oraz koszyka zakupowego (Cart)
│
├── 📁 pages/               # Główne widoki (strony) renderowane przez Router
│   ├── 📁 account/         # Panel użytkownika zalogowanego (Profil, Zamówienia)
│   ├── 📁 admin/           # Panel administracyjny (Dashboard, CMS, Zarządzanie sklepem)
│   │   └── 📁 components/  # Komponenty specyficzne dla admina (formularze CRUD, tabele)
│   └── (root)              # Widoki publiczne (Strona główna, Katalog, Logowanie, Checkout)
│
├── 📁 services/            # Warstwa komunikacji z API
│   # Centralna konfiguracja klienta HTTP (Axios) oraz serwisy domenowe
│   # (np. authService, productService, settingsService)
│
└── 📁 utils/               # Pliki konfiguracyjne, style globalne i punkt wejściowy aplikacji
```
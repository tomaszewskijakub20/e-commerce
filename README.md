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

* **Moduł Kategorii:** Pełne operacje CRUD, zarządzanie hierarchią i statusami (`soft-delete`).
* **Moduł Atrybutów:** Dynamiczne definiowanie atrybutów dla kategorii (np. 'Kolor', 'Rozmiar') z pełnym CRUD na definicjach.
* **Moduł Produktów:** * Zaawansowana edycja i dodawanie produktów (ceny, opisy, SKU).
    * **Dynamiczne Atrybuty Produktu:** Automatyczne renderowanie pól do wypełniania wartościami atrybutów na podstawie wybranej kategorii.
* **Zarządzanie Mediami:** Wysyłanie wielu zdjęć, ustawianie miniaturki (`isThumbnail`) i zarządzanie tekstem alternatywnym (Alt Text) w ramach edycji produktu.
* **Moduł Zamówień:** Przegląd i zarządzanie wszystkimi złożonymi zamówieniami.

### Strefa Użytkownika i Publiczna

* **Uwierzytelnianie i Rejestracja:** Pełny proces logowania, rejestracji oraz resetowania hasła. Rejestracja wymaga aktywacji konta przez link wysłany na e-mail (token JWT).
* **Koszyk i Checkout:** Lokalny stan koszyka (`CartContext`), dwuetapowa finalizacja zamówienia (wybór adresu, wybór płatności/akceptacja regulaminu).
* **Katalog Publiczny:** Przeglądanie produktów, katalogu kategorii oraz szczegółów produktu.
* **Trasy Chronione:** Wdrożono `ProtectedRoute` i `OwnerRoute` w oparciu o stan `AuthContext` dla pełnej kontroli dostępu.

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

Struktura projektu została zorganizowana z podziałem na logikę (services, context) i widoki (pages, components).

```
src/
├── assets/         # Pliki statyczne (ikony, obrazki)
├── components/     # Komponenty globalne (Navbar, Footer, ScrollToTop)
│   └── routes/     # Strażnicy tras (ProtectedRoute, OwnerRoute)
├── context/        # Globalne stany (AuthContext, CartContext)
├── pages/          # Widoki i strony (Home, Login, Publiczne Katalogi)
│   ├── account/    # Strefa użytkownika (ProfileDetails, OrdersList)
│   └── admin/      # Panel administracyjny
│       └── components/ # Komponenty CRUD dla admina (ProductEdit, CategoryView)
├── services/       # Logika biznesowa i API Clients
│   └── api.js      # Centralna konfiguracja Axios (interceptory)
├── App.jsx         # Główny router aplikacji
└── main.jsx        # Punkt wejścia aplikacji
```
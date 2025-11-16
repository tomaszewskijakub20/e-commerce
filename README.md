# E-commerce Frontend – Praca Inżynierska

**Autor:** Jakub Tomaszewski
**Technologie:** React, Vite, Tailwind CSS, React Router, Axios, Context API

---

## 📘 Opis projektu

Projekt stanowi frontendową część platformy **E-commerce z dynamicznymi atrybutami produktów**. Jest to aplikacja typu SPA (Single Page Application) napisana w React, która komunikuje się z dedykowanym API (backendem) w celu zarządzania i prezentacji danych.

Aplikacja implementuje **uwierzytelnianie oparte na tokenach JWT** oraz **autoryzację opartą na rolach** (użytkownik, `ROLE_OWNER`) z wykorzystaniem tras chronionych (`Protected Routes`). Komunikacja z API odbywa się poprzez centralny moduł **Axios** z interceptorami, które automatycznie zarządzają nagłówkami autoryzacyjnymi oraz obsługą wygaśnięcia sesji.

---

## ✨ Główne Funkcjonalności

Aplikacja podzielona jest na dwie główne strefy: publiczną (sklep) oraz chronioną (panel administratora).

### Panel Administratora (Właściciela)

Panel dostępny jest wyłącznie dla użytkowników z rolą `ROLE_OWNER`. Obejmuje pełen zakres operacji CRUD (Create, Read, Update, Delete) na kluczowych zasobach sklepu.

* **Moduł Kategorii:**
    * Pełne operacje **CRUD** na kategoriach.
    * Zarządzanie **hierarchią** (tworzenie kategorii głównych i podkategorii).
    * Automatyczne generowanie `seoSlug` z walidacją unikalności po stronie backendu.
    * Obsługa usuwania typu "soft-delete" (dezaktywacja).

* **Moduł Atrybutów:**
    * Dynamiczne przypisywanie atrybutów do poszczególnych kategorii.
    * Pełne operacje **CRUD** dla definicji atrybutów (np. nazwa: "Kolor", typ: "TEXT").
    * Obsługa błędów walidacji (np. blokowanie duplikatów).

* **Moduł Produktów:**
    * **Tworzenie produktu:** Dwuetapowy proces (najpierw dane, potem zdjęcia) z automatycznym przekierowaniem.
    * **Edycja produktu:** Zaawansowany formularz do modyfikacji wszystkich danych (ceny, opisy, statusy, VAT, SKU).
    * **Dynamiczny formularz atrybutów:** Interfejs automatycznie renderuje pola do wypełnienia wartościami atrybutów (np. "Farba olejna", "50x70 cm") na podstawie kategorii, do której przypisany jest produkt.
    * Obsługa logiki backendu (np. blokada zmiany kategorii, dopasowywanie DTO atrybutów).

* **Moduł Zdjęć (w ramach Edycji Produktu):**
    * Wysyłanie wielu zdjęć jednocześnie (`multipart/form-data`).
    * Podgląd nowo dodanych plików przed wysłaniem.
    * Usuwanie istniejących zdjęć.
    * Ustawianie wybranego zdjęcia jako domyślnej miniaturki (`isThumbnail`) produktu.

### Strefa Użytkownika i Publiczna

* **Uwierzytelnianie i Autoryzacja:**
    * Pełny proces logowania (`/login`) i rejestracji (`/register`) z walidacją.
    * Globalny stan (`AuthContext`) zarządzający sesją użytkownika w całej aplikacji.
    * Obsługa wygaśnięcia tokena (automatyczne wylogowanie i przekierowanie).
* **Trasy Chronione:**
    * `ProtectedRoute`: Chroni strony zwykłego użytkownika (np. `/account`).
    * `OwnerRoute`: Chroni *wszystkie* trasy panelu admina (np. `/admin/*`).
* **Katalog Produktów i Kategorii:**
    * Publiczne strony do przeglądania produktów i struktury kategorii.
    * Dynamiczne ładowanie produktów przypisanych do wybranej kategorii.
* **Strony Statyczne:**
    * W pełni ostylowane strony informacyjne (Kontakt, FAQ, Regulamin, Polityka Prywatności).

---

## 🛠️ Architektura Uwierzytelniania

Aplikacja wykorzystuje przepływ oparty na `AuthContext` i interceptorach Axios, aby zapewnić płynne i bezpieczne zarządzanie sesją.

1.  **Logowanie:** Użytkownik wysyła dane. Serwer zwraca token JWT, który jest zapisywany w `localStorage`.
2.  **`AuthContext`:** Przechowuje stan użytkownika (`user`, `isAuthenticated`). Przy starcie aplikacji próbuje zweryfikować token za pomocą `GET /api/auth/me`.
3.  **Interceptor Axios (Request):** Przed *każdym* wysłanym żądaniem do API, interceptor sprawdza `localStorage`. Jeśli znajdzie token, automatycznie dodaje go do nagłówka `Authorization: Bearer <token>`.
4.  **`OwnerRoute` / `ProtectedRoute`:** Strażnicy tras sprawdzają stan w `AuthContext` przed renderowaniem komponentu. Jeśli użytkownik nie ma uprawnień, jest przekierowywany do `/login`.
5.  **Interceptor Axios (Response):** Jeśli API odpowie błędem `401 Unauthorized` (token wygasł), interceptor automatycznie usuwa token z `localStorage` i przekierowuje użytkownika do `/login`.

---

## ⚙️ Użyte technologie

| Technologia | Zastosowanie |
| :--- | :--- |
| **React** | Budowa komponentowego interfejsu użytkownika (UI). |
| **Vite** | Narzędzie do szybkiego budowania i serwera deweloperskiego. |
| **Tailwind CSS** | Framework CSS (utility-first) do szybkiego stylowania. |
| **React Router** | Obsługa tras (routing) i nawigacja po stronie. |
| **Axios** | Komunikacja z API (interceptory zapytań i odpowiedzi). |
| **Context API** | Globalne zarządzanie stanem uwierzytelnienia (`AuthContext`). |
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
├── assets/         # Obrazki, pliki statyczne
├── components/     # Komponenty globalne (Navbar, Footer)
│   └── routes/     # Strażnicy tras (ProtectedRoute, OwnerRoute)
├── context/        # Globalny stan (AuthContext.jsx)
├── pages/          # Główne widoki/strony (Home, Login, Account)
│   └── admin/      # Widoki panelu admina (Products, Categories)
│       └── components/ # Komponenty admina (CategoryView, ProductEdit)
├── services/       # Logika biznesowa i API
│   ├── api.js      # Centralna konfiguracja Axios (interceptory)
│   └── authService.js # Funkcje logowania/rejestracji
├── App.jsx         # Główny router aplikacji (React Router)
├── main.jsx        # Punkt wejścia aplikacji
└── index.css       # Style globalne Tailwind
```
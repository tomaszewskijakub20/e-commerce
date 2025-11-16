# E-commerce Frontend – Praca Inżynierska

**Autor:** Jakub Tomaszewski
**Technologie:** React, Vite, Tailwind CSS, React Router, Axios, Context API

---

## 📘 Opis projektu

Projekt stanowi frontendową część platformy **E-commerce z dynamicznymi atrybutami produktów**. Aplikacja umożliwia zarządzanie (CRUD) oraz przeglądanie produktów i kategorii.

Frontend został zbudowany w oparciu o **React** (z Vite) i **Tailwind CSS**. Aplikacja implementuje **uwierzytelnianie oparte na tokenach JWT** (z odświeżaniem) oraz **trasy chronione** (Protected Routes) dla zwykłych użytkowników i administratorów (`ROLE_OWNER`).

Komunikacja z backendem (API) odbywa się poprzez centralny moduł **Axios** z interceptorami, które automatycznie dołączają token autoryzacyjny do zapytań.

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
# E-commerce Frontend – Dynamiczne Atrybuty Produktów

**Autor:** Jakub Tomaszewski
**Technologie:** React, Tailwind CSS, React Router, Axios

---

## 📘 Opis projektu

Projekt stanowi frontendową część platformy **E-commerce z dynamicznymi atrybutami produktów**, opracowanej w ramach pracy inżynierskiej.
Aplikacja umożliwia przeglądanie, filtrowanie i wyświetlanie produktów o zróżnicowanych, dynamicznie definiowanych atrybutach.

Frontend został zbudowany w oparciu o **React** (z wykorzystaniem Vite) i **Tailwind CSS** w celu zapewnienia wysokiej wydajności oraz nowoczesnego, responsywnego interfejsu użytkownika.

Aplikacja komunikuje się z backendem (API) stworzonym przez współautora projektu, przesyłając i pobierając dane za pomocą zapytań HTTP realizowanych przez bibliotekę **Axios**.

---

## ⚙️ Użyte technologie

| Technologia      | Zastosowanie                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| **React**        | Biblioteka JavaScript do budowy komponentowego interfejsu użytkownika.       |
| **Tailwind CSS** | Framework CSS umożliwiający szybkie stylowanie za pomocą klas narzędziowych. |
| **React Router** | Biblioteka do obsługi tras i nawigacji pomiędzy podstronami aplikacji.       |
| **Axios**        | Biblioteka do komunikacji z backendem poprzez zapytania HTTP.                |
| **Vite**         | Narzędzie do szybkiego budowania i uruchamiania aplikacji React.             |

---

## 🚀 Uruchomienie projektu lokalnie

### 1️⃣ Klonowanie repozytorium

```bash
git clone https://github.com/tomaszewskijakub20/e-commerce.git
cd e-commerce
```

### 2️⃣ Instalacja zależności

```bash
npm install
```

### 3️⃣ Konfiguracja zmiennych środowiskowych

Utwórz plik `.env` na podstawie `.env.example` i uzupełnij dane:

```
VITE_API_URL=http://localhost:5000/api
```

### 4️⃣ Uruchomienie aplikacji

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem:

```
http://localhost:5173
```

---

## 🧩 Struktura projektu

```
src/
├── assets/           # Pliki statyczne
├── components/       # Komponenty wielokrotnego użytku
├── pages/            # Widoki stron
├── App.jsx           # Główny komponent aplikacji
├── main.jsx          # Punkt wejścia aplikacji
└── index.css         # Style globalne
```

---

## 🔗 Integracja z backendem

Frontend łączy się z API backendu (tworzonego przez współautora projektu) za pomocą zmiennej środowiskowej `VITE_API_URL`.

Przykład zapytania:

```js
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export async function getProducts() {
  const response = await axios.get(`${apiUrl}/products`);
  return response.data;
}
```

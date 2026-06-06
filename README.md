# 🌡️ HeatWatch

HeatWatch is a real-time heatwave monitoring and alert platform designed to help users stay informed about extreme weather conditions. The application provides live weather data, heat risk analysis, interactive maps, and location-based alerts through a modern and responsive dashboard.

## 🚀 Features

### 📊 Real-Time Weather Monitoring

* Current temperature tracking
* Humidity monitoring
* Wind speed analysis
* Feels-like temperature calculation
* Weather condition updates

### 🔥 Heat Risk Assessment

* Heatwave detection
* Risk level classification
* Early warning alerts
* Health and safety recommendations

### 🗺️ Interactive Maps

* Location-based weather visualization
* Regional heat monitoring
* Interactive map interface using Leaflet

### 📈 Data Visualization

* Temperature trends
* Weather analytics
* Interactive charts and graphs
* Historical weather insights

### 🔐 User Authentication

* Firebase Authentication
* Secure user login
* Personalized weather tracking

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* React Router DOM

### Visualization & Maps

* Recharts
* Leaflet
* React Leaflet

### Backend Services

* Firebase Authentication
* Firebase Hosting (optional)

### UI Components

* Lucide React Icons

---

## 📂 Project Structure

src/
├── components/
├── pages/
├── context/
├── lib/
│ └── firebase.ts
├── services/
├── hooks/
└── App.tsx

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/S0hini/HeatWatch.git
cd HeatWatch
```

### Install dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Run the development server

```bash
npm run dev
```

---

## 🌍 Future Enhancements

* AI-based heatwave prediction
* Push notifications
* Satellite data integration
* District-wise heat risk forecasting
* Emergency response recommendations
* Mobile application support

---

## 👩‍💻 Author

**Sohini Das**

B.Tech CSE Student | AI & Full-Stack Development Enthusiast

GitHub: https://github.com/S0hini

---

## 📜 License

This project is developed for educational, research, and demonstration purposes.

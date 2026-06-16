# 🏆 Evolution Arena

**A high-performance, real-time competitive leaderboard system built for the HackIntym ecosystem.**

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?style=flat-square&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📖 Overview

**Evolution Arena** is a dynamic leaderboard application designed to track, rank, and showcase participant progress in real-time. Leveraging the power of Next.js and Firebase, it provides a seamless interface for users to monitor their standings and for administrators to manage competitive data.

The project focuses on high-performance rendering, fluid animations for rank changes, and a responsive design that works across all device types.

## ✨ Features

- **⚡ Real-time Updates**: Instant synchronization of scores and rankings via Firebase.
- **🎨 Modern UI/UX**: Polished interface built with Tailwind CSS and Framer Motion for smooth transitions.
- **📱 Fully Responsive**: Optimized for mobile, tablet, and desktop viewing.
- **🛠 Type-Safe**: End-to-end type safety using TypeScript to minimize runtime errors.
- **🚀 Optimized Performance**: Server-side rendering (SSR) and static generation (SSG) via Next.js for fast load times.

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | App Router, Routing, and Rendering |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Static typing and scalability |
| **Database/Auth** | [Firebase](https://firebase.google.com/) | Real-time data storage and authentication |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Fluid UI interactions and transitions |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent and lightweight iconography |

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.x or higher)
- **npm** / **yarn** / **pnpm** / **bun**
- A **Firebase Project** (for database and configuration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ajay1234-dev/hackintym-leaderboard.git
   cd hackintym-leaderboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory and add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 💻 Usage

### Development Workflow
- **Linting**: Run `npm run lint` to check for code quality issues.
- **Building**: Run `npm run build` to create an optimized production build.
- **Starting**: Run `npm run start` to launch the production server.

### Project Structure
```text
├── app/               # Next.js App Router (Pages, Layouts, API)
├── components/        # Reusable UI components
├── lib/               # Firebase config and utility functions
├── public/            # Static assets
└── styles/            # Global styles and Tailwind configurations
```

## 🖼 Screenshots

*(Add your screenshots or GIFs here to showcase the leaderboard in action)*
`[ Placeholder for Dashboard Screenshot ]`
`[ Placeholder for Mobile View Screenshot ]`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

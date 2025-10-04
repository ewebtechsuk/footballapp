# Football App

Welcome to the Football App! This application allows users from around the world to create and manage their own football teams,
compete in tournaments, and win prizes.

## Features

- **Team Management**: Users can create and manage their football teams with family and friends.
- **Tournaments**: Enter various tournaments and compete for prizes.
- **User Profiles**: Each user has a profile to manage their information and settings.
- **Community**: Connect with other users and build your own football community.

## Getting Started

To get started with the Football App, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/football-app.git
   cd football-app
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   This project reuses the Expo workspace that lives in `football-app-expo/`. During installation a postinstall script links the
   pre-populated `football-app-expo/node_modules` directory so the React Native bundle can resolve packages without reaching the
   public npm registry. If you ever need to refresh the dependencies, run `npm install` inside `football-app-expo/` (which already
   vendors the required packages in this repository).

3. **Run the Application**:
   ```bash
   npm start
   ```

## Project Structure

The project is organized as follows:

- `src/`: Contains the source code for the application.
  - `screens/`: Contains the different screens of the app.
  - `components/`: Contains reusable components.
  - `services/`: Contains API and authentication services.
  - `store/`: Contains Redux store and slices for state management.
  - `models/`: Contains data models used in the app.
  - `utils/`: Contains utility functions.
- `assets/`: Contains fonts and icons used in the application.
- `ios/`: iOS-specific files.
- `android/`: Android-specific files.
- `package.json`: Configuration file for npm.
- `tsconfig.json`: TypeScript configuration file.
- `.gitignore`: Specifies files to be ignored by Git.

## Contributing

We welcome contributions! If you would like to contribute to the Football App, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Expo + Firebase setup

1. Create a Firebase project at https://console.firebase.google.com and enable Email/Password sign-in and Firestore.

2. Add a web app in Firebase and copy the config values. Set them as environment variables for local development (or replace the
 placeholders in `src/services/firebase.ts`):

```
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

3. The repository already includes the Expo workspace under `football-app-expo/` with its dependencies checked in. If you prefer to
   manage them yourself, you can reinstall inside that directory:

```
cd football-app-expo
npm install
```

4. Run the app with Expo (recommended):

```
npx expo start
```

Notes:
- For iOS builds you may need macOS or use EAS Build.
- This repository contains starter Firebase helpers in `src/services/` (see `firebase.ts`, `auth.ts`, and `firestore.ts`).

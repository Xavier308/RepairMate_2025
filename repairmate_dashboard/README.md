# RepairMate - Machine Troubleshooting Dashboard

## Overview

RepairMate is a web application built with React and Django, designed to help technicians troubleshoot and manage machinery efficiently. This README focuses on the frontend part of the project, which is built with React.

## Technologies Used

- **React**: A JavaScript library for building user interfaces. React allows us to create reusable UI components and manage the application state efficiently.
- **CSS**: Used for styling the application. We use pure CSS for maximum flexibility and control over the design.
- **React Router**: For handling routing in our single-page application.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd repairmate-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Install React Router:
   ```
   npm install react-router-dom
   ```
4. Install date-fns - for reminders
   ```
   npm install date-fns
   ```

   npm install date-fns-tz

   
### Running the Development Server

To start the development server:

```
npm start
```

This will run the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Building for Production

To create a production build:

```
npm run build
```

This will create a `build` folder with optimized production files.

## Project Structure

tree -I 'build|node_modules|*.json|public|.gitignore' -a

```
Dashboard
├── README.md
├── React_README.md
└── src
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── assets
    │   ├── images
    │   │   ├── alinity_machine.png
    │   │   ├── repairmaite_sidebarClosed.svg
    │   │   └── repairmate_logo.png
    │   └── styles
    ├── components
    │   ├── Account.css
    │   ├── Account.js
    │   ├── AddMachine.css
    │   ├── AddMachine.js
    │   ├── AllIssues.css
    │   ├── AllIssues.js
    │   ├── Auth.css
    │   ├── EditMachine.css
    │   ├── EditMachine.js
    │   ├── EnhancedTroubleshoot.css
    │   ├── EnhancedTroubleshoot.js
    │   ├── Header.css
    │   ├── Header.js
    │   ├── Home.css
    │   ├── Home.js
    │   ├── IssuePage.css
    │   ├── IssuePage.js
    │   ├── Login.js
    │   ├── MachineDetails.css
    │   ├── MachineDetails.js
    │   ├── ManageIssues.css
    │   ├── ManageIssues.js
    │   ├── MyMachines.css
    │   ├── MyMachines.js
    │   ├── PossibleIssues.css
    │   ├── PossibleIssues.js
    │   ├── Register.js
    │   ├── SearchBar.js
    │   ├── Settings.css
    │   ├── Settings.js
    │   ├── Sidebar.js
    │   ├── SolutionPage.js
    │   ├── StepGuide.css
    │   ├── StepGuide.js
    │   ├── Training.css
    │   ├── Training.js
    │   ├── Troubleshoot.css
    │   ├── Troubleshoot.js
    │   ├── TroubleshootDetail.css
    │   ├── TroubleshootDetail.js
    │   ├── TroubleshootGuide.css
    │   ├── TroubleshootGuide.js
    │   └── gooeyEffect.js
    ├── index.css
    ├── index.js
    ├── layouts
    │   └── MainLayout.js
    ├── logo.svg
    ├── reportWebVitals.js
    ├── services
    │   └── api.js
    ├── setupTests.js
    └── theme
        └── theme.js
```

## Key Components

- `App.js`: The main component that sets up routing and authentication.
- `components/`: Contains all the individual components of the application.
- `layouts/MainLayout.js`: Defines the main layout structure used across the app.
- `services/api.js`: Handles API calls to the backend.

## Styling

We use CSS for styling our components. Each component has its own CSS file (e.g., `Home.css` for `Home.js`) to keep styles modular and maintainable.

## API Integration

The `services/api.js` file contains functions for making API calls to the Django backend. Make sure to update the `API_URL` in this file if your backend URL changes.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Additional Notes

- Remember to run `npm install` whenever new dependencies are added to the project.
- Keep the README updated as the project evolves.
- For any backend-related setup or issues, refer to the Django project's documentation.
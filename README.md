# RepairMate

RepairMate is a comprehensive web application designed to streamline machine troubleshooting and employee training. This repository contains three main components: the backend, the dashboard, and the landing page.

## Repository Structure

```
repairmate/
├── repairmate_backend/    # Django backend
├── repairmate_dashboard/  # React dashboard
└── repairmate_landingpage/ # HTML/CSS landing page
```

## Features

- **Quick Troubleshooting**: Identify and resolve machine issues rapidly with our intuitive interface and comprehensive knowledge base.
- **Interactive Training**: Empower your employees with interactive, machine-specific training modules to enhance their skills and productivity.
- **Real-time Collaboration**: Enable seamless communication between team members for faster problem-solving and knowledge sharing.

## Technologies Used

- Backend: Python, Django, Django REST Framework, PostgreSQL
- Dashboard: React, JavaScript, HTML, CSS
- Landing Page: HTML5, CSS3

## RepairMate Backend

### Setup

1. Navigate to the backend directory:
   ```
   cd repairmate_backend
   ```

2. Create a virtual environment:
   ```
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables in a `.env` file.

5. Run migrations:
   ```
   python3 manage.py migrate
   ```

6. Start the development server:
   ```
   python3 manage.py runserver
   ```

For more detailed information about the backend, refer to the [Backend README](repairmate_backend/README.md).

## RepairMate Dashboard

### Setup

1. Navigate to the dashboard directory:
   ```
   cd repairmate_dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Build for production:
   ```
   npm run build
   ```

## RepairMate Landing Page

### Setup

1. Navigate to the landing page directory:
   ```
   cd repairmate_landingpage
   ```

2. Open `index.html` in a web browser to view the landing page.

### Customization

1. Modify the content in `index.html` to match your specific RepairMate implementation.
2. Update the images in the `assets/` directory with your own visuals.
3. Adjust the Tailwind CSS classes in `index.html` to fine-tune the layout and styling.

## Deployment

### Backend
Deploy the Django backend to a server that supports Python and PostgreSQL. Configure your web server (e.g., Nginx) to serve the Django application.

### Dashboard
Build the React dashboard and deploy the built files to a static file hosting service or a CDN.

### Landing Page
Upload the landing page files to any web server or static file hosting service.

## Contributing

We welcome contributions to improve RepairMate. Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive commit messages.
4. Push your changes to your fork.
5. Submit a pull request to the main repository.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For any inquiries or support, please contact:
- Email: support@repairmate.com
- Website: [https://www.repairmate.io](https://www.repairmate.io)
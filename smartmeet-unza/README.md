# SmartMeet UNZA

A meeting room booking system for the University of Zambia (UNZA).

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartmeet-unza
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build Tailwind CSS**
   ```bash
   # For development (watches for changes)
   npm run dev
   
   # For production (minified)
   npm run build
   ```

4. **Start the development server**
   ```bash
   # Start your preferred local server (e.g., Live Server in VS Code)
   # or use Python's built-in server:
   python -m http.server 8000
   ```

## Project Structure

- `/admin` - Admin dashboard and management interface
- `/auth` - Authentication pages (login, register, etc.)
- `/public` - Publicly accessible assets
  - `/css` - Compiled CSS files
  - `/js` - JavaScript files
  - `/images` - Image assets
- `/src` - Source files
  - `input.css` - Tailwind CSS source file
- `/user-ui` - User interface components

## Dependencies

- Tailwind CSS v3.4.1
- Font Awesome 6.0.0
- Flatpickr (for date/time pickers)

## Development

- Run `npm run dev` to start the Tailwind CSS build process in watch mode
- The main CSS file is built to `/public/css/tailwind.css`

## Building for Production

1. Run `npm run build` to create a production-optimized CSS file
2. Deploy the entire project directory to your web server

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

[MIT License](LICENSE)

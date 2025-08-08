# E-Auction Web Application

## Project Structure

```
e-auction-web-rev/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility libraries
│   └── index.html
├── server/                 # Backend Express application
│   ├── index.ts            # Main server file
│   ├── routes.ts           # API routes
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection
│   └── storage.ts          # File storage logic
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Database schema
├── config/                 # Configuration files
│   ├── vite.config.ts      # Vite configuration
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── drizzle.config.ts   # Drizzle ORM configuration
│   └── postcss.config.js   # PostCSS configuration
├── database/               # Database files and migrations
│   ├── auction.db          # SQLite database file
│   ├── migration.sql       # Database migration script
│   └── update-payment-status.sql
├── scripts/                # Utility scripts
│   ├── database/           # Database management scripts
│   │   ├── check-db.js
│   │   ├── fix-db-schema.js
│   │   └── ...
│   ├── testing/            # Test scripts
│   │   ├── test-*.js
│   │   └── simple-test.js
│   └── setup/              # Setup and installation scripts
│       ├── setup-*.bat
│       └── startup-fix.bat
├── docs/                   # Documentation files
│   ├── README.md           # Project documentation
│   ├── FIX-SUMMARY.md      # Fix summary
│   └── INVOICE-SYSTEM-COMPLETE.md
├── dist/                   # Built application
├── node_modules/           # Dependencies
├── package.json            # Project configuration
└── components.json         # UI components configuration
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

## Configuration

All configuration files are now organized in the `config/` directory for better maintainability.

## Database

Database files and SQL scripts are located in the `database/` directory.

## Scripts

Utility scripts are organized by purpose:
- `scripts/database/` - Database management and fixes
- `scripts/testing/` - Test files and testing utilities  
- `scripts/setup/` - Installation and setup scripts

## Documentation

Project documentation is available in the `docs/` directory.

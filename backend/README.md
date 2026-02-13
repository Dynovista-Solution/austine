# AUSTINE Backend API

A Node.js/Express backend API for the AUSTINE ecommerce website.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Product Management**: Full CRUD operations for products with categories, variants, and reviews
- **Content Management**: Dynamic website content management (branding, homepage, social media, etc.)
- **File Upload**: Image upload functionality for products and content
- **Security**: Helmet, CORS, rate limiting, input validation
- **Database**: MongoDB with Mongoose ODM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: multer
- **Security**: helmet, cors, express-rate-limit
- **Validation**: express-validator

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env` file and update the values:
   ```bash
   # Database
   MONGODB_URI=mongodb://localhost:27017/austine

   # JWT Secret (change this in production!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Frontend URL
   FRONTEND_URL=http://localhost:5174
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows with MongoDB installed locally
   mongod

   # Or use MongoDB Compass/Atlas for cloud database
   ```

5. **Run the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products (with filtering/pagination)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Content Management
- `GET /api/content/:type` - Get content by type
- `PUT /api/content/:type` - Update content (Admin only)
- `GET /api/content` - Get all content types

### File Upload
- `POST /api/upload/image` - Upload single image (Admin only)
- `POST /api/upload/images` - Upload multiple images (Admin only)
- `DELETE /api/upload/:filename` - Delete uploaded file (Admin only)

### Orders (Coming Soon)
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Users (Coming Soon)
- `GET /api/users` - Get users (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)

## Database Models

### User
- Authentication and profile management
- Role-based access (customer, admin, super_admin)
- Wishlist and cart functionality

### Product
- Product information with variants
- Categories and subcategories
- Reviews and ratings
- SEO optimization

### Order
- Order management with status tracking
- Payment and shipping information
- Order history

### Content
- Dynamic website content
- Branding, homepage, social media, navigation
- Version control for content changes

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Input Validation**: express-validator for all inputs
- **File Upload Security**: Type and size restrictions

## Development

### Project Structure
```
backend/
├── models/          # Database models
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── uploads/         # Uploaded files directory
├── utils/           # Utility functions
├── server.js        # Main server file
├── .env             # Environment variables
└── package.json     # Dependencies and scripts
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented yet)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/austine |
| `JWT_SECRET` | JWT signing secret | (required) |
| `FRONTEND_URL` | Frontend application URL | http://localhost:5174 |
| `MAX_FILE_SIZE` | Maximum file upload size | 5242880 (5MB) |
| `ALLOWED_FILE_TYPES` | Comma-separated allowed MIME types | image/jpeg,image/png,image/gif,image/webp |

### PayU

PayU requires different endpoints/credentials for **test** vs **live**.

Important: this backend uses `PAYU_ENV` (not `NODE_ENV`) to choose PayU test/live URLs, so deploying your backend with `NODE_ENV=production` won’t accidentally switch you to live.

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYU_ENV` | `test` or `live` | test |
| `PAYU_MERCHANT_KEY` | PayU merchant key (depends on env) | xxxx |
| `PAYU_MERCHANT_SALT` | PayU merchant salt (depends on env) | xxxx |
| `PAYU_PAYMENT_URL` | Optional override for payment URL | https://test.payu.in/_payment |

### Mailgun (Email Notifications)

Set these to enable emails on user registration and order events.

| Variable | Description | Example |
|----------|-------------|---------|
| `MAILGUN_API_KEY` | Mailgun private API key | key-xxxx |
| `MAILGUN_DOMAIN` | Mailgun sending domain | mg.yourdomain.com |
| `MAIL_FROM` | Default From address | `AUSTINE <no-reply@mg.yourdomain.com>` |
| `STORE_OWNER_EMAIL` | Store owner/admin email to notify | owner@yourdomain.com |
| `STORE_NAME` | Store name used in subjects/body | AUSTINE |

## Next Steps

1. **Install MongoDB**: Set up MongoDB database
2. **Test API Endpoints**: Use Postman or similar to test endpoints
3. **Connect Frontend**: Update React app to use API instead of localStorage
4. **Implement Orders**: Complete order management functionality
5. **Add Payment Integration**: Integrate payment gateways (Stripe, PayPal)
6. **Email Notifications**: Add email service for order confirmations
7. **Admin Dashboard**: Build admin interface for the backend
8. **Deploy**: Set up production deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
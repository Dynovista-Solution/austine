const { connectDB } = require('./config/database');
const User = require('./models/User');
const Content = require('./models/Content');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@austine.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      // try common defaults
      existingAdmin = await User.findOne({ email: 'admin@example.com' }) || await User.findOne({ email: 'admin@austine.com' });
    }

    if (!existingAdmin) {
      await User.create({ email: adminEmail, password: adminPassword, name: 'Admin User', role: 'super_admin' });
      console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
    } else {
      existingAdmin.email = adminEmail;
      existingAdmin.role = 'super_admin';
      existingAdmin.password = adminPassword; // will be hashed by pre-save
      await existingAdmin.save();
      console.log(`Admin user ensured: ${adminEmail} / ${adminPassword}`);
    }

    const contentTypes = ['homepage', 'branding', 'social_media', 'navigation'];
    for (const type of contentTypes) {
      let content = await Content.findOne({ type });
      if (!content) {
        let defaultData = {};
        switch (type) {
          case 'homepage':
            defaultData = {
              hero: {
                title: 'Welcome to AUSTINE',
                subtitle: 'Discover luxury fashion & lifestyle',
                primaryButton: { text: 'Shop Now', link: '/products' },
                secondaryButton: { text: 'Learn More', link: '/about' }
              },
              footerBanner: { text: 'Free shipping on orders over €100', link: '/shipping' }
            };
            break;
          case 'branding':
            defaultData = { siteName: 'AUSTINE', siteDescription: 'Luxury Fashion & Lifestyle', logoUrl: '/logo.jpg', faviconUrl: '/favicon.ico' };
            break;
          case 'social_media':
            defaultData = { socialMedia: [
              { platform: 'Facebook', url: 'https://facebook.com/austine', icon: 'FacebookIcon', enabled: true },
              { platform: 'Instagram', url: 'https://instagram.com/austine', icon: 'InstagramIcon', enabled: true },
              { platform: 'Twitter', url: 'https://twitter.com/austine', icon: 'TwitterIcon', enabled: true }
            ]};
            break;
          case 'navigation':
            defaultData = {
              header: { home: 'Home', products: 'Products', about: 'About', contact: 'Contact' },
              footer: { description: 'Discover the latest in luxury fashion and lifestyle at AUSTINE. Premium quality, exceptional style.', copyright: '© 2025 AUSTINE. All rights reserved.' }
            };
            break;
        }
        await Content.create({ type, data: defaultData });
        console.log(`Default ${type} content created`);
      } else {
        console.log(`${type} content already exists`);
      }
    }

    // Seed sample products if none exist
    const existingProductCount = await Product.countDocuments();
    if (existingProductCount === 0) {
      const sampleProducts = [
        {
          name: 'Leather Ballerina',
          description: 'Elegant leather ballerina flats with cushioned insoles for all-day comfort.',
          shortDescription: 'Elegant leather flats',
          price: 129.99,
          category: 'FOOTWEAR',
          images: [
            { url: '/products/product11.jpg', isPrimary: true },
            { url: '/products/product4.jpg' }
          ],
          variants: [
            { key: 'black', label: 'Black', stock: 10 },
            { key: 'nude', label: 'Nude', stock: 8 }
          ],
          isFeatured: true,
          isNewArrival: true
        },
        {
          name: 'Patent leather Miss M Mini bag',
          description: 'Compact patent leather mini bag with adjustable strap and magnetic closure.',
          shortDescription: 'Compact patent leather bag',
          price: 335,
          category: 'BAGS',
          images: [
            { url: '/products/product2.jpg', isPrimary: true },
            { url: '/products/product12.jpg' }
          ],
          variants: [
            { key: 'burgundy', label: 'Burgundy', stock: 5 },
            { key: 'black', label: 'Black', stock: 7 },
            { key: 'silver', label: 'Silver', stock: 4 }
          ],
          isFeatured: true
        },
        {
          name: 'Wool Sweater',
          description: 'Soft wool sweater perfect for cooler days. Classic fit and ribbed trims.',
          shortDescription: 'Soft wool sweater',
          price: 99,
          category: 'CLOTHING',
          images: [
            { url: '/products/product3.jpg', isPrimary: true }
          ],
          variants: [
            { key: 's', label: 'S', stock: 6 },
            { key: 'm', label: 'M', stock: 6 },
            { key: 'l', label: 'L', stock: 6 }
          ],
          isNewArrival: true
        },
        {
          name: 'Chelsea Boots',
          description: 'Durable leather Chelsea boots with elastic side panels and pull tab.',
          shortDescription: 'Durable Chelsea boots',
          price: 149,
          category: 'FOOTWEAR',
          images: [
            { url: '/products/product4.jpg', isPrimary: true }
          ],
          variants: [
            { key: '40', label: 'EU 40', stock: 3 },
            { key: '41', label: 'EU 41', stock: 5 },
            { key: '42', label: 'EU 42', stock: 2 }
          ]
        },
        {
          name: 'Shoulder Bag',
          description: 'Versatile shoulder bag with spacious interior and premium hardware.',
          price: 210,
          category: 'BAGS',
          images: [
            { url: '/products/product5.jpg', isPrimary: true }
          ],
          isFeatured: false
        },
        {
          name: 'Casual Sneakers',
          description: 'Comfortable everyday sneakers with breathable mesh and rubber outsole.',
          price: 120,
          category: 'FOOTWEAR',
          images: [
            { url: '/products/product1.jpg', isPrimary: true }
          ],
          isFeatured: true
        }
      ];

      await Product.insertMany(sampleProducts);
      console.log(`Seeded ${sampleProducts.length} sample products`);
    } else {
      console.log(`Products already exist: ${existingProductCount}`);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    process.exit(0);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
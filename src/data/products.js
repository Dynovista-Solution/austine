export const products = [
  { id: '1', name: 'Leather Ballerina', price: 129.99, image: '/products/product11.jpg' },
  {
    id: '2',
    name: 'Patent leather Miss M Mini bag',
    price: 335,
    image: '/products/product2.jpg',
    categoryTrail: ['Bags', 'M bags'],
    gallery: ['/products/product2.jpg', '/products/product12.jpg'],
    variants: [
      { key: 'v1', label: 'Burgundy', image: '/products/product13.jpg' },
      { key: 'v2', label: 'Black', image: '/products/product14.jpg' },
      { key: 'v3', label: 'Dark brown', image: '/products/product15.jpg' },
      { key: 'v4', label: 'Silver', image: '/products/product16.jpg' },
      { key: 'v5', label: 'Black', image: '/products/product1.jpg' },
    ],
    size: ['TU'],
  },
  { id: '3', name: 'Wool Sweater', price: 99.0, image: '/products/product3.jpg' },
  { id: '4', name: 'Chelsea Boots', price: 149.0, image: '/products/product4.jpg' },
]

export function getProductById(id) {
  return products.find(p => p.id === id)
}

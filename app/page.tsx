'use client';

import { useState } from 'react';
import './globals.css';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

const products: Product[] = [
  { id: 1, name: 'Wireless Headphones', price: 99.99, description: 'High-quality wireless headphones' },
  { id: 2, name: 'Smart Watch', price: 199.99, description: 'Feature-rich smartwatch' },
  { id: 3, name: 'Laptop Stand', price: 49.99, description: 'Ergonomic laptop stand' },
];

export default function HomePage() {
  const [cart, setCart] = useState<number[]>([]);
  const [message, setMessage] = useState('');

  const addToCart = (productId: number) => {
    setCart([...cart, productId]);
    setMessage(`Added product ${productId} to cart!`);
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div>
      <h2>Products</h2>
      {message && <div className="success">{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {products.map((product) => (
          <div key={product.id} className="card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p style={{ fontWeight: 'bold', fontSize: '18px' }}>${product.price}</p>
            <button onClick={() => addToCart(product.id)}>Add to Cart</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h3>Cart ({cart.length} items)</h3>
        {cart.length > 0 ? (
          <>
            <p>Items in cart: {cart.join(', ')}</p>
            <a href="/cart">
              <button>View Cart</button>
            </a>
          </>
        ) : (
          <p>Your cart is empty</p>
        )}
      </div>
    </div>
  );
}

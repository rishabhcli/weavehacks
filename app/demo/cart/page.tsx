'use client';

import { useState } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

// Simulated cart data
const initialCart: CartItem[] = [
  { id: 1, name: 'Wireless Headphones', price: 99.99, quantity: 1 },
  { id: 2, name: 'Smart Watch', price: 199.99, quantity: 1 },
];

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const removeItem = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // BUG 1: This function is defined but NOT attached to the checkout button
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });

      if (response.ok) {
        setCheckoutComplete(true);
        setCart([]);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (checkoutComplete) {
    return (
      <div className="card">
        <h2>Order Confirmed!</h2>
        <p className="success">Thank you for your purchase!</p>
        <a href="/demo">
          <button>Continue Shopping</button>
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2>Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="card">
          <p>Your cart is empty</p>
          <a href="/demo">
            <button>Browse Products</button>
          </a>
        </div>
      ) : (
        <>
          <div className="card">
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <div>
                  <strong>{item.name}</strong>
                  <p style={{ margin: '5px 0', color: '#666' }}>Qty: {item.quantity}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontWeight: 'bold' }}>${(item.price * item.quantity).toFixed(2)}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ background: '#e00', padding: '5px 10px' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: '#f8f8f8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Total: ${total.toFixed(2)}</h3>
              {/* BUG 1: Missing onClick handler - the button does nothing when clicked */}
              <button
                onClick={handleCheckout}
                id="checkout-button"
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

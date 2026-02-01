'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Sparkles, Star, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  rating: number;
  gradient: string;
}

const products: Product[] = [
  { 
    id: 1, 
    name: 'Wireless Headphones', 
    price: 99.99, 
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life',
    category: 'Audio',
    rating: 4.8,
    gradient: 'from-violet-500 to-purple-600',
  },
  { 
    id: 2, 
    name: 'Smart Watch', 
    price: 199.99, 
    description: 'Advanced fitness tracking, heart rate monitoring, and seamless smartphone integration',
    category: 'Wearables',
    rating: 4.9,
    gradient: 'from-blue-500 to-cyan-600',
  },
  { 
    id: 3, 
    name: 'Laptop Stand', 
    price: 49.99, 
    description: 'Ergonomic aluminum stand with adjustable height for comfortable working',
    category: 'Accessories',
    rating: 4.7,
    gradient: 'from-emerald-500 to-teal-600',
  },
];

export default function DemoProductsPage() {
  const [cart, setCart] = useState<number[]>([]);
  const [addedId, setAddedId] = useState<number | null>(null);

  const addToCart = (productId: number) => {
    setCart([...cart, productId]);
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 1500);
  };

  const isInCart = (productId: number) => cart.includes(productId);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-500/20 border border-white/10 p-8 md:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-orange-400" />
            <span className="text-sm font-medium text-orange-400/90">Demo E-commerce Store</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome to the Test Shop
          </h1>
          <p className="text-muted-foreground max-w-xl">
            This is a demo storefront that PatchPilot uses for testing. Add items to cart and checkout to trigger test scenarios.
          </p>
        </div>

        {/* Cart Summary Badge */}
        {cart.length > 0 && (
          <motion.div 
            className="absolute top-6 right-6 flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full border border-primary/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm font-medium">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</span>
          </motion.div>
        )}
      </motion.div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              className="group relative rounded-2xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-white/20 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              {/* Product Image Placeholder */}
              <div className={`h-48 bg-gradient-to-br ${product.gradient} flex items-center justify-center relative overflow-hidden`}>
                <Package className="h-16 w-16 text-white/80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Category Badge */}
                <Badge 
                  className="absolute top-3 left-3 bg-black/30 border-white/20 text-white backdrop-blur-sm"
                >
                  {product.category}
                </Badge>

                {/* Rating */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-white font-medium">{product.rating}</span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    ${product.price}
                  </span>
                  
                  <Button
                    onClick={() => addToCart(product.id)}
                    disabled={addedId === product.id}
                    className={`relative transition-all duration-300 ${
                      isInCart(product.id) && addedId !== product.id
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : ''
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {addedId === product.id ? (
                        <motion.span
                          key="added"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Check className="h-4 w-4" />
                          Added!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <a href="/demo/cart">
            <Button 
              size="lg" 
              className="shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              View Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
            </Button>
          </a>
        </motion.div>
      )}
    </div>
  );
}

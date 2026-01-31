import { NextRequest, NextResponse } from 'next/server';

// BUG 2: The API endpoint is defined but makes a call to a non-existent external service
// When this is called, it will fail because /api/payments doesn't exist

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Calculate total
    const total = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    // BUG 2: Calling wrong internal endpoint - /api/payments doesn't exist!
    // This should be handled directly or call a real payment processor
    const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total }),
    });

    if (!paymentResponse.ok) {
      throw new Error('Payment processing failed');
    }

    return NextResponse.json({
      success: true,
      orderId: `ORD-${Date.now()}`,
      total,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}

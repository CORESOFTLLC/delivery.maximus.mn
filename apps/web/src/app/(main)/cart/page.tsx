'use client';

import { redirect } from 'next/navigation';

// Redirect /cart to /checkout-v2
export default function CartPage() {
  redirect('/checkout-v2');
}

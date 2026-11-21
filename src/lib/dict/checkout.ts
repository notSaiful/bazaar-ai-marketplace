import type { Dict } from "../i18n-core";

/** Cart, checkout, payment, orders and account strings. */
export const checkout: Dict = {
  // Shared
  "checkout.total": { en: "Total", hi: "कुल" },
  "checkout.checkout": { en: "Checkout", hi: "चेकआउट" },
  "checkout.browse": { en: "Browse products", hi: "उत्पाद देखें" },

  // Cart drawer, cart lines, add-to-cart buttons
  "checkout.cart.empty": { en: "Your cart is empty", hi: "आपका कार्ट खाली है" },
  "checkout.cart.emptyHint": { en: "Add items from any seller. You'll pay once for all of them.", hi: "किसी भी विक्रेता से सामान जोड़ें। सबके लिए एक ही बार पेमेंट करें।" },
  "checkout.cart.itemsFrom": { en: "Items from {name}", hi: "{name} का सामान" },
  "checkout.cart.arrives": { en: "arrives {eta}", hi: "डिलीवरी {eta}" },
  "checkout.cart.decrease": { en: "Decrease quantity", hi: "मात्रा घटाएँ" },
  "checkout.cart.increase": { en: "Increase quantity", hi: "मात्रा बढ़ाएँ" },
  "checkout.cart.remove": { en: "Remove {title}", hi: "{title} हटाएँ" },
  "checkout.cart.open": { en: "Open cart, {n} items", hi: "कार्ट खोलें, {n} आइटम" },
  "checkout.cart.dialog": { en: "Shopping cart", hi: "शॉपिंग कार्ट" },
  "checkout.cart.close": { en: "Close cart", hi: "कार्ट बंद करें" },
  "checkout.cart.addToCart": { en: "Add to cart", hi: "कार्ट में डालें" },
  "checkout.cart.add": { en: "Add", hi: "जोड़ें" },
  "checkout.cart.soldOut": { en: "Sold out", hi: "बिक गया" },
  "checkout.cart.outOfStock": { en: "Out of stock", hi: "स्टॉक में नहीं" },

  // Checkout form
  "checkout.form.title": { en: "Delivery details", hi: "डिलीवरी की जानकारी" },
  "checkout.form.cartEmpty": { en: "Your cart is empty.", hi: "आपका कार्ट खाली है।" },
  "checkout.form.name": { en: "Name", hi: "नाम" },
  "checkout.form.mobile": { en: "Mobile", hi: "मोबाइल नंबर" },
  "checkout.form.address": { en: "Address", hi: "पता" },
  "checkout.form.city": { en: "City", hi: "शहर" },
  "checkout.form.pincode": { en: "Pincode", hi: "पिनकोड" },
  "checkout.form.pinBad": { en: "We don't deliver to this pincode yet.", hi: "इस पिनकोड पर अभी डिलीवरी उपलब्ध नहीं है।" },
  "checkout.form.startFailed": { en: "Could not start checkout", hi: "चेकआउट शुरू नहीं हो सका" },
  "checkout.form.items.one": { en: "{n} item", hi: "{n} आइटम" },
  "checkout.form.items.many": { en: "{n} items", hi: "{n} आइटम" },
  "checkout.form.fromSellers.one": { en: "from {n} seller", hi: "{n} विक्रेता से" },
  "checkout.form.fromSellers.many": { en: "from {n} sellers", hi: "{n} विक्रेताओं से" },
  "checkout.form.summary": { en: "{items} {from} · free delivery", hi: "{from} {items} · मुफ़्त डिलीवरी" },
  "checkout.form.continue": { en: "Continue to payment", hi: "पेमेंट के लिए आगे बढ़ें" },

  // Payment
  "checkout.pay.meta": { en: "Pay", hi: "पेमेंट करें" },
  "checkout.pay.title": { en: "Payment", hi: "पेमेंट" },
  "checkout.pay.expired": { en: "Payment window expired", hi: "पेमेंट का समय खत्म हो गया" },
  "checkout.pay.didntGoThrough": { en: "Payment didn't go through", hi: "पेमेंट नहीं हो पाया" },
  "checkout.pay.savedHint": { en: "Your cart is saved. Start again from checkout.", hi: "आपका कार्ट सेव है। चेकआउट से फिर से शुरू करें।" },
  "checkout.pay.backToCheckout": { en: "Back to checkout", hi: "चेकआउट पर वापस जाएँ" },
  "checkout.pay.youPay": { en: "You pay", hi: "आप चुकाएँगे" },
  "checkout.pay.failed": { en: "Payment failed. Your cart is safe, so you can try again.", hi: "पेमेंट नहीं हो पाया। आपका कार्ट सुरक्षित है, आप फिर से कोशिश कर सकते हैं।" },
  "checkout.pay.payAmount": { en: "Pay {amount}", hi: "{amount} का पेमेंट करें" },
  "checkout.pay.razorpayTest": { en: "Razorpay test mode: UPI or card.", hi: "Razorpay टेस्ट मोड: UPI या कार्ड।" },
  "checkout.pay.mockNote": { en: "Test payment, no real money moves.", hi: "टेस्ट पेमेंट, असली पैसे नहीं कटेंगे।" },
  "checkout.pay.simulateFailure": { en: "Simulate a failure", hi: "पेमेंट फ़ेल करके देखें" },

  // Orders
  "checkout.orders.empty": { en: "No orders yet", hi: "अभी तक कोई ऑर्डर नहीं" },
  "checkout.orders.startShopping": { en: "Start shopping", hi: "खरीदारी शुरू करें" },
  "checkout.orders.orderNo": { en: "Order #{id}", hi: "ऑर्डर #{id}" },
  "checkout.orders.sellers.one": { en: "{n} seller", hi: "{n} विक्रेता" },
  "checkout.orders.sellers.many": { en: "{n} sellers", hi: "{n} विक्रेता" },
  "checkout.order.meta": { en: "Order", hi: "ऑर्डर" },
  "checkout.order.paid": { en: "Paid {amount}", hi: "{amount} का पेमेंट हो गया" },
  "checkout.order.perSeller.one": { en: "{n} order, one per seller.", hi: "{n} ऑर्डर, हर विक्रेता का अलग।" },
  "checkout.order.perSeller.many": { en: "{n} orders, one per seller.", hi: "{n} ऑर्डर, हर विक्रेता का अलग।" },
  "checkout.order.groupStatus": { en: "This order group is {status}.", hi: "इस ऑर्डर ग्रुप की स्थिति: {status}।" },
  "checkout.order.status.expired": { en: "expired", hi: "समय खत्म" },
  "checkout.order.viewAll": { en: "View all my orders", hi: "मेरे सभी ऑर्डर देखें" },
  "checkout.order.fromCity": { en: "from {city}", hi: "{city} से" },
  "checkout.order.progress": { en: "Fulfilment progress", hi: "डिलीवरी की प्रगति" },
  "checkout.order.tracking": { en: "Tracking history", hi: "ट्रैकिंग इतिहास" },

  // Commission split (SplitBreakdown)

  // Account
  "checkout.account.sub": { en: "Demo account. Sign-in and profile editing are not enabled.", hi: "डेमो खाता। साइन-इन और प्रोफ़ाइल बदलने की सुविधा अभी चालू नहीं है।" },
  "checkout.account.profile": { en: "Profile", hi: "प्रोफ़ाइल" },
  "checkout.account.name": { en: "Name", hi: "नाम" },
  "checkout.account.actingAs": { en: "Acting as", hi: "भूमिका" },
  "checkout.account.preferences": { en: "Preferences", hi: "पसंद और सेटिंग्स" },
  "checkout.account.ordersHint": { en: "Track deliveries and request refunds.", hi: "डिलीवरी ट्रैक करें और रिफ़ंड का अनुरोध करें।" },
  "checkout.account.viewOrders": { en: "View orders", hi: "ऑर्डर देखें" },
  "checkout.account.language": { en: "Language", hi: "भाषा" },
  "checkout.account.theme": { en: "Theme", hi: "थीम" },
  "checkout.account.themeSystem": { en: "Match system", hi: "सिस्टम के अनुसार" },
  "checkout.account.themeLight": { en: "Light", hi: "लाइट" },
  "checkout.account.themeDark": { en: "Dark", hi: "डार्क" },
};

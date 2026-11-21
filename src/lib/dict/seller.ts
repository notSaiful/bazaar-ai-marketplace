import type { Dict, Lang } from "../i18n-core";
import { common } from "./common";

/** seller strings: seller portal, listing form, seller sidebar, and server-action flash messages (msg.*). */
export const seller: Dict = {
  /* ---- portal chrome ---- */
  "seller.gate.title": { en: "Selling on Bazaar", hi: "Bazaar पर बेचें" },
  "seller.gate.hint": { en: "Switch to the seller view to add products and manage orders.", hi: "उत्पाद जोड़ने और ऑर्डर संभालने के लिए विक्रेता व्यू पर जाएँ।" },
  "seller.gate.switch": { en: "Switch to selling", hi: "विक्रेता व्यू पर जाएँ" },
  "seller.registerNewShop": { en: "Register a new shop", hi: "नई दुकान रजिस्टर करें" },
  "seller.banner.pending": { en: "Waiting for approval. You can save drafts now; publishing unlocks once an admin approves your shop.", hi: "मंज़ूरी का इंतज़ार है। आप अभी ड्राफ़्ट सेव कर सकते हैं; एडमिन से दुकान मंज़ूर होते ही आप पब्लिश कर पाएँगे।" },
  "seller.banner.suspended": { en: "Your shop is suspended and hidden from customers.", hi: "आपकी दुकान निलंबित है और ग्राहकों को नहीं दिख रही।" },
  "seller.nav.section": { en: "Section", hi: "सेक्शन" },
  "seller.nav.overview": { en: "Overview", hi: "ओवरव्यू" },
  "seller.nav.sellers": { en: "Sellers", hi: "विक्रेता" },
  "seller.nav.money": { en: "Money", hi: "हिसाब" },

  /* ---- dashboard ---- */
  "seller.home.title": { en: "My shop", hi: "मेरी दुकान" },
  "seller.home.addFromPhoto": { en: "Add a product from a photo", hi: "फ़ोटो से उत्पाद जोड़ें" },
  "seller.home.ordersToShip": { en: "Orders to ship", hi: "भेजने वाले ऑर्डर" },
  "seller.home.totalSales": { en: "Total sales", hi: "कुल बिक्री" },
  "seller.home.runningLow": { en: "Running low", hi: "स्टॉक कम है" },
  "seller.home.left": { en: "{n} left", hi: "{n} बचे" },
  "seller.home.newStockFor": { en: "New stock for {title}", hi: "{title} का नया स्टॉक" },
  "seller.home.restock": { en: "Restock", hi: "स्टॉक भरें" },

  /* ---- earnings ---- */
  "seller.earn.ready": { en: "Ready for payout", hi: "पेआउट के लिए तैयार" },
  "seller.earn.escrow": { en: "Waiting for delivery", hi: "डिलीवरी का इंतज़ार" },
  "seller.earn.paidOut": { en: "Paid out", hi: "पेआउट हो चुका" },
  "seller.earn.statement": { en: "Statement matches your ledger balance ({amount}). Payouts are released after delivery.", hi: "स्टेटमेंट आपके लेजर बैलेंस ({amount}) से मेल खाता है। पेआउट डिलीवरी के बाद जारी होता है।" },
  "seller.earn.empty": { en: "No earnings yet", hi: "अभी कोई कमाई नहीं" },
  "seller.earn.col.order": { en: "Order", hi: "ऑर्डर" },
  "seller.earn.col.item": { en: "Item", hi: "आइटम" },
  "seller.earn.col.gross": { en: "Gross", hi: "कुल राशि" },
  "seller.earn.col.fee": { en: "Platform fee", hi: "प्लेटफ़ॉर्म फ़ीस" },
  "seller.earn.col.payout": { en: "Your payout", hi: "आपका पेआउट" },
  "seller.earn.col.status": { en: "Status", hi: "स्थिति" },
  "seller.earn.paidOutBadge": { en: "paid out", hi: "पेआउट हो गया" },

  /* ---- fee split (gross / commission / payout) ---- */

  /* ---- onboarding ---- */
  "seller.onb.meta": { en: "Seller onboarding", hi: "विक्रेता ऑनबोर्डिंग" },
  "seller.onb.title": { en: "Store profile & onboarding", hi: "दुकान प्रोफ़ाइल और ऑनबोर्डिंग" },
  "seller.onb.sub": { en: "New stores stay pending until an admin approves them.", hi: "नई दुकानें एडमिन की मंज़ूरी मिलने तक लंबित रहती हैं।" },
  "seller.onb.bank": { en: "bank ••••{last4}", hi: "बैंक ••••{last4}" },
  "seller.onb.fee": { en: "Platform fee {pct}", hi: "प्लेटफ़ॉर्म फ़ीस {pct}" },
  "seller.onb.registerTitle": { en: "Register a new store", hi: "नई दुकान रजिस्टर करें" },
  "seller.onb.registerHint": { en: "Creates a pending store and switches you into it. Then approve it from the Admin role to see the full flow.", hi: "इससे एक लंबित दुकान बनेगी और आप उसी में पहुँच जाएँगे। पूरा फ़्लो देखने के लिए फिर एडमिन भूमिका से इसे मंज़ूर करें।" },
  "seller.onb.name": { en: "Store name", hi: "दुकान का नाम" },
  "seller.onb.namePh": { en: "Kumhar Clay Works", hi: "कुम्हार मिट्टी कला" },
  "seller.onb.city": { en: "City", hi: "शहर" },
  "seller.onb.cityPh": { en: "Khurja", hi: "खुर्जा" },
  "seller.onb.tagline": { en: "Tagline (optional)", hi: "टैगलाइन (वैकल्पिक)" },
  "seller.onb.taglinePh": { en: "Hand-thrown pottery", hi: "हाथ से बने मिट्टी के बर्तन" },
  "seller.onb.bankLabel": { en: "Bank account, last 4 digits", hi: "बैंक खाते के आखिरी 4 अंक" },
  "seller.onb.gstin": { en: "GSTIN (optional)", hi: "GSTIN (वैकल्पिक)" },
  "seller.onb.submit": { en: "Submit for approval", hi: "मंज़ूरी के लिए भेजें" },

  /* ---- orders ---- */
  "seller.orders.tab.todo": { en: "To do", hi: "करना है" },
  "seller.orders.tab.shipped": { en: "Shipped", hi: "भेजे गए" },
  "seller.orders.tab.done": { en: "Done", hi: "पूरे हुए" },
  "seller.orders.accept": { en: "Accept", hi: "स्वीकार करें" },
  "seller.orders.markPacked": { en: "Mark packed", hi: "पैक हो गया" },
  "seller.orders.markShipped": { en: "Mark shipped", hi: "भेज दिया" },
  "seller.orders.markDelivered": { en: "Mark delivered", hi: "डिलीवर हो गया" },
  "seller.orders.empty": { en: "Nothing here", hi: "यहाँ कुछ नहीं है" },

  /* ---- products ---- */
  "seller.products.addFromPhoto": { en: "Add from photo", hi: "फ़ोटो से जोड़ें" },
  "seller.products.empty": { en: "No products yet", hi: "अभी कोई उत्पाद नहीं" },
  "seller.products.emptyHint": { en: "Take a photo and we'll write the listing for you.", hi: "बस फ़ोटो लीजिए, लिस्टिंग हम लिख देंगे।" },
  "seller.products.addFirst": { en: "Add your first product", hi: "अपना पहला उत्पाद जोड़ें" },
  "seller.products.stockFor": { en: "Stock for {title}", hi: "{title} का स्टॉक" },
  "seller.products.addMeta": { en: "Add product", hi: "उत्पाद जोड़ें" },
  "seller.products.addTitle": { en: "Add a product", hi: "उत्पाद जोड़ें" },
  "seller.products.edit": { en: "Edit product", hi: "उत्पाद बदलें" },
  "seller.products.flagged": { en: "Flagged: {reason}", hi: "जाँच के लिए रोका गया: {reason}" },

  /* ---- listing form (photo-to-listing) ---- */
  "seller.form.sample.diya": { en: "Brass diya", hi: "पीतल का दीया" },
  "seller.form.sample.kurta": { en: "Cotton kurta", hi: "सूती कुर्ता" },
  "seller.form.sample.jhumka": { en: "Silver jhumka", hi: "चाँदी के झुमके" },
  "seller.form.sample.chai": { en: "Masala chai", hi: "मसाला चाय" },
  "seller.form.photoAlt": { en: "Your product photo", hi: "आपके उत्पाद की फ़ोटो" },
  "seller.form.photoPrompt": { en: "Take or upload a photo of your product", hi: "अपने उत्पाद की फ़ोटो लें या अपलोड करें" },
  "seller.form.differentPhoto": { en: "Use a different photo", hi: "दूसरी फ़ोटो लें" },
  "seller.form.takePhoto": { en: "Take or upload photo", hi: "फ़ोटो लें या अपलोड करें" },
  "seller.form.retake": { en: "Retake", hi: "फिर से लें" },
  "seller.form.trySample": { en: "or try a sample:", hi: "या सैंपल आज़माएँ:" },
  "seller.form.writing": { en: "Writing your listing in English and Hindi…", hi: "आपकी लिस्टिंग अंग्रेज़ी और हिंदी में लिखी जा रही है…" },
  "seller.form.unclear": { en: "The photo is unclear. Please retake.", hi: "फ़ोटो साफ़ नहीं है। कृपया दोबारा लें।" },
  "seller.form.draftReady": { en: "Draft ready. Check the details, set your price, then publish. Suggested range ₹{min}–₹{max} (you decide).", hi: "ड्राफ़्ट तैयार है। जानकारी जाँचें, अपनी कीमत तय करें, फिर पब्लिश करें। सुझाई गई रेंज ₹{min}–₹{max} (फ़ैसला आपका)।" },
  "seller.form.draftReadyIn": { en: "Draft ready in {n}s. Check the details, set your price, then publish. Suggested range ₹{min}–₹{max} (you decide).", hi: "ड्राफ़्ट {n} सेकंड में तैयार है। जानकारी जाँचें, अपनी कीमत तय करें, फिर पब्लिश करें। सुझाई गई रेंज ₹{min}–₹{max} (फ़ैसला आपका)।" },
  "seller.form.name": { en: "Name", hi: "नाम (अंग्रेज़ी)" },
  "seller.form.price": { en: "Price (₹)", hi: "कीमत (₹)" },
  "seller.form.stock": { en: "In stock", hi: "स्टॉक में" },
  "seller.form.more": { en: "More details (description, Hindi, category)", hi: "और जानकारी (विवरण, हिंदी, श्रेणी)" },
  "seller.form.category": { en: "Category", hi: "श्रेणी" },
  "seller.form.description": { en: "Description", hi: "विवरण (अंग्रेज़ी)" },
  "seller.form.mrp": { en: "MRP (₹, optional)", hi: "MRP (₹, वैकल्पिक)" },
  "seller.form.tags": { en: "Search words", hi: "खोज शब्द" },
  "seller.form.attributes": { en: "Details, one per line (Name: value)", hi: "विशेषताएँ, हर लाइन में एक (नाम: मान)" },
  "seller.form.publish": { en: "Publish", hi: "पब्लिश करें" },
  "seller.form.saveDraft": { en: "Save as draft", hi: "ड्राफ़्ट सेव करें" },
  "seller.form.publishLocked": { en: "Publishing unlocks once your shop is approved.", hi: "दुकान मंज़ूर होने के बाद आप पब्लिश कर पाएँगे।" },

  /* ---- toasts ---- */
  "seller.toast.newOrder": { en: "New order {id}: {n} item(s)", hi: "नया ऑर्डर {id}: {n} आइटम" },

  /* ---- server-action flash messages ---- */
  "msg.seller.registerInvalid": { en: "Enter store name, city and the last 4 digits of your bank account.", hi: "दुकान का नाम, शहर और बैंक खाते के आखिरी 4 अंक डालें।" },
  "msg.seller.registered": { en: "Store submitted! It's pending admin approval. You can draft products now; publishing unlocks after approval.", hi: "दुकान जमा हो गई! एडमिन की मंज़ूरी बाकी है। आप अभी उत्पादों के ड्राफ़्ट बना सकते हैं; मंज़ूरी के बाद पब्लिश कर पाएँगे।" },
  "msg.product.flagged": { en: "Saved, but flagged for admin review before it goes live.", hi: "सेव हो गया, पर लाइव होने से पहले इसे एडमिन जाँच के लिए रोका गया है।" },
  "msg.product.published": { en: "Published! It's live on the storefront.", hi: "पब्लिश हो गया! अब यह दुकान पर लाइव है।" },
  "msg.product.draftSaved": { en: "Draft saved.", hi: "ड्राफ़्ट सेव हो गया।" },
  "msg.product.archived": { en: "Product archived.", hi: "उत्पाद संग्रहित कर दिया गया।" },
  "msg.stock.updated": { en: "Stock updated. The storefront badge follows within seconds.", hi: "स्टॉक अपडेट हो गया। दुकान पर बदलाव कुछ ही सेकंड में दिखेगा।" },
  "msg.order.marked": { en: "Order marked {status}. The buyer sees it immediately.", hi: "ऑर्डर की स्थिति अब: {status}। खरीदार को यह तुरंत दिखेगा।" },
  "msg.review.switch": { en: "Switch to Shopping to write a review.", hi: "रिव्यू लिखने के लिए खरीदार व्यू पर जाएँ।" },
  "msg.review.tooFast": { en: "You're posting reviews very fast. Please wait a minute.", hi: "आप बहुत तेज़ी से रिव्यू डाल रहे हैं। कृपया एक मिनट रुकें।" },
  "msg.review.held": { en: "Thanks! Your review is waiting for a quick check by our team before it appears.", hi: "धन्यवाद! दिखने से पहले हमारी टीम आपके रिव्यू को एक बार जाँचेगी।" },
  "msg.review.live": { en: "Thanks! Your review is live.", hi: "धन्यवाद! आपका रिव्यू लाइव है।" },

  /* fixed English errors that come back from src/lib/store.ts, src/lib/ai.ts and /api/ai/listing */
  "msg.err.orderNotFound": { en: "Order not found", hi: "ऑर्डर नहीं मिला" },
  "msg.err.notYourOrder": { en: "Not your order", hi: "यह आपका ऑर्डर नहीं है" },
  "msg.err.transition": { en: "Invalid transition: {from} → {to}", hi: "यह ऑर्डर “{from}” से “{to}” पर नहीं जा सकता" },
  "msg.err.sellerNotFound": { en: "Seller not found", hi: "विक्रेता नहीं मिला" },
  "msg.err.titleShort": { en: "Title is too short", hi: "नाम बहुत छोटा है" },
  "msg.err.priceZero": { en: "Price must be greater than zero", hi: "कीमत शून्य से ज़्यादा होनी चाहिए" },
  "msg.err.stockNegative": { en: "Stock cannot be negative", hi: "स्टॉक माइनस में नहीं हो सकता" },
  "msg.err.storePending": { en: "Your store is pending approval. Save as a draft until an admin approves it.", hi: "आपकी दुकान की मंज़ूरी बाकी है। एडमिन की मंज़ूरी तक इसे ड्राफ़्ट के रूप में सेव करें।" },
  "msg.err.storeSuspended": { en: "Your store is suspended.", hi: "आपकी दुकान निलंबित है।" },
  "msg.err.notYourProduct": { en: "Not your product", hi: "यह आपका उत्पाद नहीं है" },
  "msg.err.stockBelowZero": { en: "Stock cannot go below zero", hi: "स्टॉक शून्य से कम नहीं हो सकता" },
  "msg.err.productNotFound": { en: "Product not found", hi: "उत्पाद नहीं मिला" },
  "msg.err.reviewUnavailable": { en: "This product is not available for reviews.", hi: "इस उत्पाद पर रिव्यू नहीं दिया जा सकता।" },
  "msg.err.reviewStars": { en: "Choose a rating from 1 to 5 stars.", hi: "1 से 5 स्टार के बीच रेटिंग चुनें।" },
  "msg.err.reviewName": { en: "Enter a name between 2 and 40 characters.", hi: "2 से 40 अक्षरों के बीच नाम डालें।" },
  "msg.err.reviewShort": { en: "Write at least 10 characters about the product.", hi: "उत्पाद के बारे में कम से कम 10 अक्षर लिखें।" },
  "msg.err.reviewLong": { en: "Keep the review under 600 characters.", hi: "रिव्यू 600 अक्षरों से कम रखें।" },
  "msg.err.reviewDuplicate": { en: "You have already reviewed this product.", hi: "आप इस उत्पाद का रिव्यू पहले ही दे चुके हैं।" },
  "msg.err.flagInjection": { en: "Text contains instructions aimed at AI agents (prompt-injection pattern).", hi: "टेक्स्ट में AI एजेंट के लिए निर्देश हैं (प्रॉम्प्ट-इंजेक्शन पैटर्न)।" },
  "msg.err.flagPrice": { en: "Price is more than 80% below MRP; possible pricing error or bait listing.", hi: "कीमत MRP से 80% से भी ज़्यादा कम है; कीमत में गलती या भ्रामक लिस्टिंग हो सकती है।" },
  "msg.err.photoTiny": { en: "The photo is very small or blank. Retake in good light with the product centred.", hi: "फ़ोटो बहुत छोटी या खाली है। अच्छी रोशनी में उत्पाद को बीच में रखकर फिर से लें।" },
  "msg.err.sellerRole": { en: "Seller role required", hi: "इसके लिए विक्रेता व्यू ज़रूरी है" },
  "msg.err.tooMany": { en: "Too many requests", hi: "बहुत ज़्यादा अनुरोध। थोड़ी देर बाद कोशिश करें" },
  "msg.err.invalidInput": { en: "Invalid input", hi: "जानकारी सही नहीं है" },
  "msg.err.aiFailed": { en: "AI request failed", hi: "AI से जवाब नहीं मिला" },
};

/** Exact English strings returned by store/ai/API code, mapped to their msg.* key. */
const FIXED: Record<string, string> = Object.fromEntries(
  Object.entries(seller).filter(([k, v]) => k.startsWith("msg.err.") && !v.en.includes("{")).map(([k, v]) => [v.en, k]),
);

/**
 * Localise a fixed English message produced outside the UI (store errors, moderation flag reasons, AI errors).
 * English is returned untouched; unknown text falls back to the original.
 */
export function localizeMsg(text: string, lang: Lang): string {
  if (lang === "en" || !text) return text;
  const key = FIXED[text];
  if (key) return seller[key].hi;
  const m = /^Invalid transition: (\w+) → (\w+)$/.exec(text);
  if (m) {
    const st = (x: string) => common[`status.${x}`]?.hi ?? x;
    return seller["msg.err.transition"].hi.replace("{from}", st(m[1])).replace("{to}", st(m[2]));
  }
  return text;
}

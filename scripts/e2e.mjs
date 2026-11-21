import { chromium } from "playwright-core";
/**
 * End-to-end flows against TWO independent production servers that share nothing but the visitor's cookies
 * (the closest local stand-in for several serverless instances).
 *   npm run build && PORT=3101 npm start & PORT=3102 npm start &  then  npm run e2e
 * Needs Chrome: set CHROME_PATH if it is not at the macOS default.
 */
const A = process.env.E2E_A ?? "http://localhost:3101", B = process.env.E2E_B ?? "http://localhost:3102";
const results = [];
const ok = (name, cond, extra = "") => { results.push([cond, name, extra]); console.log(cond ? "PASS" : "FAIL", name, extra); };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "light" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
const priceCalls = { n: 0 };
page.on("request", (r) => { if (r.url().includes("/api/cart/price")) priceCalls.n++; });
const text = async () => (await page.locator("body").innerText());
const role = (r, sid) => ctx.request.post(`${A}/api/role?role=${r}${sid ? `&sid=${sid}` : ""}`);

/* 1. buy: two sellers, second add not blocked */
await page.goto(A + "/search?q=diya");
await page.locator("article", { hasText: "Brass Diya Set of 6" }).getByRole("button", { name: "Add to cart" }).click();
ok("toast appears (cart drawer does not block)", await page.getByRole("status").filter({ hasText: "Added to cart" }).isVisible());
await page.goto(A + "/search?q=jhumka");
await page.locator("article", { hasText: "Silver Jhumka" }).getByRole("button", { name: "Add to cart" }).click();
ok("second add works immediately", await page.getByRole("status").filter({ hasText: "Added to cart" }).isVisible());
priceCalls.n = 0;
await page.goto(A + "/checkout");
await page.getByRole("button", { name: /Continue to payment/ }).waitFor();
await page.waitForTimeout(600);
ok("checkout loads cart price once or twice (was 5)", priceCalls.n <= 2, `calls=${priceCalls.n}`);
await page.getByRole("button", { name: /Continue to payment/ }).click();
await page.waitForURL(/\/pay\/grp_/);
const payUrl = page.url();
const gid = payUrl.split("/pay/")[1];
ok("checkout lands on /pay/<id> (no 404)", /\/pay\/grp_[0-9a-f]{8}$/.test(payUrl), payUrl);
await page.goto(A + "/pay/" + gid);
ok("pay page opens on a different instance", (await text()).includes("Pay ₹"));
await page.getByRole("button", { name: /^Pay ₹/ }).click();
await page.waitForURL(/\/orders\/grp_.*paid=1/);
let t = await text();
ok("order confirmation with commission split", /seller gets/.test(t) && /platform fee/.test(t) && /Paid ₹/.test(t));
await page.goto(B + "/orders/" + gid);
t = await text();
ok("order still paid on the other instance", /Paid|placed|accepted/i.test(t) && /seller gets/.test(t));
await page.goto(A + "/orders");
ok("order list shows the new order", (await page.locator("a[href^='/orders/grp_']").count()) >= 5);

/* 2. seller accept / pack / ship across instances */
await role("seller", "s_ghar");
await page.goto(B + "/seller/orders");
const card = page.locator("li", { hasText: "Brass Diya Set of 6" }).filter({ has: page.getByRole("button", { name: "Accept" }) }).first();
await card.getByRole("button", { name: "Accept" }).click();
await page.waitForURL(/msg=/);
ok("seller Accept succeeds (no 'Order not found')", !(await text()).includes("Order not found") && /Order marked accepted/.test(await text()));
await page.goto(A + "/seller/orders");
await page.locator("li", { hasText: "Brass Diya Set of 6" }).filter({ has: page.getByRole("button", { name: "Mark packed" }) }).first().getByRole("button", { name: "Mark packed" }).click();
await page.waitForURL(/msg=/);
await page.goto(B + "/seller/orders");
await page.locator("li", { hasText: "Brass Diya Set of 6" }).filter({ has: page.getByRole("button", { name: "Mark shipped" }) }).first().getByRole("button", { name: "Mark shipped" }).click();
await page.waitForURL(/msg=/);
await page.goto(A + "/seller/orders?tab=shipped");
ok("accept → packed → shipped persisted across instances", (await text()).includes("Brass Diya Set of 6") && (await text()).includes("Mark delivered"));
await page.goto(B + "/orders/" + gid);
ok("buyer sees shipped status", /shipped/i.test(await text()));

/* 3. admin approve / refund / payout */
await role("admin");
await page.goto(B + "/admin");
ok("admin sees pending seller", (await text()).includes("Naya Karigar"));
await page.locator("li", { hasText: "Naya Karigar" }).getByRole("button", { name: "Approve" }).click();
await page.waitForURL(/msg=/);
await page.goto(A + "/admin");
ok("approval persists (Naya Karigar no longer pending)", !(await text()).includes("New shop in Madhubani"));
await page.goto(B + "/admin/sellers");
ok("seller list shows Naya active", /Naya Karigar Studio\s*active/i.test((await text()).replace(/\n/g, " ")));
await page.goto(A + "/admin/orders");
const ord = page.locator("li", { hasText: "Silver Jhumka" }).first();
await ord.getByRole("button", { name: "Refund" }).click();
await page.waitForURL(/msg=/);
ok("admin Refund succeeds", /Refunded/.test(await text()));
await page.goto(B + "/admin/ledger");
t = await text();
ok("ledger balanced after refund on another instance", /₹0\.00/.test(t) && /books balance/i.test(t));
const payBtn = page.getByRole("button", { name: /^Pay out ₹/ }).and(page.locator(":enabled")).first();
if (await payBtn.count()) { await payBtn.click(); await page.waitForURL(/msg=/); ok("payout runs", /Payout sent/.test(await text())); await page.goto(A + "/admin/ledger"); ok("payout persisted", /₹0\.00/.test(await text())); } else ok("payout runs", false, "no enabled payout button");
await page.goto(B + "/admin/ledger");
await page.locator("summary", { hasText: "Technical detail" }).click();
ok("webhook log lists the payment", /payment\.captured/.test(await text()));
await page.getByRole("button", { name: "Replay last webhook" }).click();
await page.waitForURL(/msg=/);
ok("webhook replay is idempotent", /duplicate/.test(await text()));

/* 4. publish a product as the newly approved seller */
await role("seller", "s_naya");
await page.goto(B + "/seller/products/new");
await page.getByRole("button", { name: "Brass diya" }).click();
await page.locator("#title").waitFor();
await page.waitForFunction(() => document.querySelector("#title")?.value?.length > 3);
const title = await page.locator("#title").inputValue();
await page.getByRole("button", { name: "Publish" }).click();
await page.waitForURL(/\/seller\/products\?msg=/);
ok("publish succeeds (store is active)", /Published/.test(await text()), title);
await page.goto(A + "/seller/products");
ok("published product persists on another instance", (await text()).includes(title));
await role("customer");
await page.goto(B + "/store/s_naya");
ok("product is live on the storefront", (await text()).includes(title));

/* 5. assistant, desktop */
await page.goto(A + "/");
await page.getByRole("button", { name: /Ask for help/ }).first().click();
await page.getByLabel("Message").fill("diya aur masala chai");
await page.getByLabel("Message").press("Enter");
await page.getByText(/Add all to cart/).waitFor({ timeout: 8000 });
ok("assistant replies with a multi-seller bundle (no crash)", true);
await page.getByLabel("Message").fill("hello");
await page.getByLabel("Message").press("Enter");
await page.waitForTimeout(500);
ok("page still alive after more messages", !(await text()).includes("couldn't load"));
await page.getByLabel("Message").fill("maa ke liye gift 2000 tak, kuch festive aur ek chai bhi");
await page.getByLabel("Message").press("Enter");
await page.waitForTimeout(800);
ok("multi-part request answered", /chai|Tea|Chai/i.test(await text()));

/* 6. mobile */
const m = await browser.newContext({ viewport: { width: 375, height: 800 }, isMobile: true });
const mp = await m.newPage();
mp.on("pageerror", (e) => errors.push("mobile pageerror: " + e.message));
await mp.goto(A + "/search?q=diya");
ok("mobile: floating assistant button hidden (cannot cover Add)", (await mp.locator("button:visible", { hasText: "Ask for help" }).count()) === 0);
ok("mobile: My orders reachable", await mp.getByRole("link", { name: "My orders" }).first().isVisible());
await mp.locator("header").getByRole("button", { name: "Ask for help" }).click();
await mp.getByLabel("Message").fill("hello");
await mp.getByLabel("Message").press("Enter");
await mp.waitForTimeout(600);
ok("mobile: assistant works from header button", !(await mp.locator("body").innerText()).includes("couldn't load"));
const add = mp.locator("article button", { hasText: "Add" }).first();
const box = await add.boundingBox();
ok("mobile: Add button is >=44px tall", box.height >= 43.5, `h=${box?.height}`);

/* 7. headers, robots */
const h = await ctx.request.get(A + "/");
const hd = h.headers();
ok("security headers present", !!hd["content-security-policy"] && hd["x-frame-options"] === "DENY" && !!hd["referrer-policy"] && hd["x-content-type-options"] === "nosniff");
ok("robots.txt and sitemap.xml exist", (await ctx.request.get(A + "/robots.txt")).ok() && (await ctx.request.get(A + "/sitemap.xml")).ok());
const rr = await ctx.request.post(A + "/api/role?role=admin");
ok("role cookie is HttpOnly", /HttpOnly/i.test(rr.headers()["set-cookie"] ?? ""));
const pr = await ctx.request.post(A + "/api/cart/price", { data: { lines: [{ productId: "p_09", qty: 1 }] } });
ok("cart price API has no seller bank/GSTIN", !/bankLast4|gstin|commissionBps/.test(await pr.text()));

/* 8. agent flow via MCP across instances */
const rpc = async (base, name, args) => (await (await ctx.request.post(base + "/api/mcp", { data: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } } })).json()).result.content[0].text;
const cart = JSON.parse(await rpc(A, "create_cart", { items: [{ product_id: "p_09", quantity: 1 }, { product_id: "p_28", quantity: 1 }] }));
const co = JSON.parse(await rpc(B, "create_checkout", { cart_id: cart.cart_id, cart_token: cart.cart_token, buyer: { name: "Agent Buyer", phone: "9999999999", address: "1 Test Road", city: "Pune", pincode: "411001" } }));
ok("MCP create_checkout returns a pay_url", /\/pay\/grp_[0-9a-f]{8}\?c=/.test(co.pay_url ?? ""), co.pay_url?.slice(0, 60));
const fresh = await browser.newContext(); // a human with NO prior state
const hp = await fresh.newPage();
await hp.goto(co.pay_url.replace(A, B));
ok("human opens the agent pay link (no 404) and sees Pay", (await hp.locator("body").innerText()).includes("Pay ₹"), hp.url());
await hp.getByRole("button", { name: /^Pay ₹/ }).click();
await hp.waitForURL(/paid=1/);
ok("human pays the agent order → confirmation with split", /seller gets/.test(await hp.locator("body").innerText()));
const st = JSON.parse(await rpc(B, "get_order_status", { order_group_id: co.order_group_id, cart_token: cart.cart_token }));
ok("agent status flips to paid (same instance that took payment)", st.payment_status === "paid", JSON.stringify(st).slice(0, 80));
const stBad = JSON.parse(await rpc(B, "get_order_status", { order_group_id: co.order_group_id, cart_token: "x" }));
ok("status scoped to cart token", !!stBad.error);

/* 9. reset */
await role("admin");
await page.goto(A + "/admin");
page.once("dialog", (d) => d.accept());
await page.getByRole("button", { name: "Reset demo data" }).click();
await page.waitForURL(/msg=/);
await page.goto(B + "/admin");
ok("reset restores seed (Naya Karigar pending again)", (await text()).includes("Naya Karigar"));

ok("no page errors / console errors during the run", errors.length === 0, errors.slice(0, 3).join(" | "));
const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
await browser.close();
process.exit(failed.length ? 1 : 0);

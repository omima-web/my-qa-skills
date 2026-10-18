# Sub-module taxonomy & resolution

Every test case and every ticket analysis MUST be tagged with a sub-module from this list. A wrong sub-module silently poisons coverage tracking, so **never guess silently** — resolve it with the procedure below and surface the pick before tagging.

## Why the epic matters
A story's **epic is almost always the sub-module** (or points straight at it). So even when the PM never wrote the sub-module in the story, reading the linked epic — and the sibling stories under it, which usually share a sub-module — is how you infer it. This is why ticket analysis always walks the epic and the links.

## Resolution procedure (stop at first confident answer)
0. **Identify the product/squad first** — from the Jira project, the epic, or the story's area, determine which squad's taxonomy applies (Shipping, Checkout Experience, …). Load that product's section below. **If the product isn't in this file, don't guess** — resolve via steps 1–2 (explicit/epic) and ask the user to confirm the sub-module, then note it should be added (see "Adding a squad").
1. **Explicit** — the story/epic names a sub-module from that product's list → use it.
2. **Epic anchor** — read the linked epic and sibling stories; match their feature to the list.
3. **Signal match** — match title, description, ACs, and technical terms (field names, endpoints, screen names) against the product's list below (English + Arabic).
4. **Confidence gate:**
   - Strong single match → propose it, ask the user to confirm (one tap).
   - Weak / multiple candidates → show the ranked candidates and ask the user to pick.
   - No match → show the product's list and ask the user to choose (or flag "new sub-module?" if genuinely none fit).

Record the resolved sub-module AND how it was resolved (explicit / epic / signal / user-picked) so review can audit it.

## Taxonomy — Shipping squad (project: SHPD)

Format: `Audience › Area › Sub-module (EN | AR)`.

### Customer
| Area | Sub-module (EN) | Sub-module (AR) |
|---|---|---|
| Checkout (الدفع) | Shipping Fees | تكلفة الشحن |
| Checkout (الدفع) | Shipping Address | عنوان الشحن |
| Branches (الفروع) | Branches | الفروع |

### Merchant
| Area | Sub-module (EN) | Sub-module (AR) |
|---|---|---|
| Shipping (الشحن) | Tier | — |
| Shipping (الشحن) | Private Shipping Companies | المناديب |
| Shipping (الشحن) | Salla Policies (Policy Issuance) | بوليصات سلة |
| Shipping (الشحن) | Packaging | مواد التغليف |
| Shipping (الشحن) | COD | الدفع عند الاستلام |
| Shipping (الشحن) | Shipping Rules | قيود شركات الشحن |
| Shipping (الشحن) | Shipping Rate Calculator | حاسبة أسعار الشحن |
| Shipping (الشحن) | Operations Management | إدارة التشغيل |
| Shipping (الشحن) | Storage | التخزين والتجهيزين |
| Shipping (الشحن) | Archive | ارشيف البوليصات |
| Shipping (الشحن) | Shipping Settings | الاعدادات |
| Shipping (الشحن) | Shipping Costs And Profits | تكاليف وأرباح الشحن |
| Shipping (الشحن) | Delivery Promise | وعد التوصيل |

## Taxonomy — Checkout Experience squad

Format: `Audience › Area › Sub-module (EN | AR)`. (Cross-checked against the YouTrack SP sub-system schema.)

### Customer
| Area | Sub-module (EN) | Sub-module (AR) |
|---|---|---|
| Checkout (الدفع) | Store Payments | الدفع |
| Checkout (الدفع) | Total Order | إجمالي الطلب |
| Checkout (الدفع) | VAT Calculation | ضريبة القيمة المضافة |
| Checkout (الدفع) | Pending Payments | طلبات بإنتظار الدفع |
| Cart (السلة) | Add/Remove Items | تحديث عدد المنتج |
| Cart (السلة) | Wallet (points redemption) | إستبدال نقاط المحفظة |
| Cart (السلة) | Customer Wallet | محفظة العميل |
| Cart (السلة) | Complete Order | إتمام الطلب |
| Cart (السلة) | Cart Summary | إجمالي سلة التسوق |
| Cart (السلة) | Add a comment | إضافة ملاحظة |
| Cart (السلة) | Attach Image | إرفاق ملف |
| Products View (المنتجات) | Product Details - Add to Cart | إضافة إلى السلة |
| Homepage (الصفحة الرئيسية) | Order Now (Homepage) | اطلب الآن |
| Homepage (الصفحة الرئيسية) | Add to Cart | إضافة إلى السلة |

### Merchant
| Area | Sub-module (EN) | Sub-module (AR) |
|---|---|---|
| Payments (المدفوعات) | Electronic Payments Section | المدفوعات الإلكترونية |
| Payments (المدفوعات) | Digital Wallets | المحافظ الرقمية |
| Payments (المدفوعات) | Buy Now, Pay Later (Configurations) | اشتري الآن وادفع لاحقا |
| Payments (المدفوعات) | Bank Accounts | الحسابات البنكية |
| Payments (المدفوعات) | Payment Page Settings | اعدادات صفحة الدفع |
| Payments (المدفوعات) | Store Wallet | رصيد المتجر |
| Payments (المدفوعات) | E-Payments Wallet | رصيد المدفوعات الإلكترونية |
| Payments (المدفوعات) | COD Wallet | رصيد مدفوعات الدفع عند الاستلام |
| Payments (المدفوعات) | Billing Settings Section | إعدادات الفوترة |
| Payments (المدفوعات) | Bank Transfer Requests | طلبات الحوالات البنكية |
| Payments (المدفوعات) | Payment Restrictions | قيود الدفع |
| Payments (المدفوعات) | VAT Configuration | ضريبة القيمة المضافة |
| Payments (المدفوعات) | E-payments | عمليات الدفع الإلكتروني |
| Order Refund (استرداد الطلب) | Order Refund | استرداد الطلب |
| Marketing Tools (الأدوات التسويقية) | Gift Cards | بطاقات الهدايا |
| Marketing Tools (الأدوات التسويقية) | Gifting System | نظام الاهداء |

## Tagging convention
Tag the sub-module as `Audience › Area › Sub-module` (e.g. `Merchant › Shipping › Shipping Rules`, or short form `Shipping Rules`). On a test case, put it in the sub-module field/label so coverage can be sliced by it — mirroring how the KPI framework attributes work by squad and sub-system.

## Adding a squad (this suite is shared across squads)
Each squad's product gets its own `## Taxonomy — <Squad>` section here. **Canonical source:** the master sub-systems sheet (https://docs.google.com/spreadsheets/d/1z9ul9I65U9Mpwao66kpC1xRLPaSIlLAMH47NBJzpU_A/edit?gid=1364201804). Note: that sheet currently can't be read by the Drive connector (a Workspace "not for AI" label), so this file is the machine-readable copy — **refresh it from the sheet by hand when the sheet changes**.

When running for a squad whose product **isn't** in this file:
- Resolve via steps 0–2 (product → explicit → epic) as far as possible.
- **Ask the user** to confirm the sub-module (or paste their squad's sub-module list), and note it should be added here.
- Never silently invent a sub-module for an unknown squad.

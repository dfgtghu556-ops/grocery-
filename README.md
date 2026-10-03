# BudgetBasket

**Plan your month. Control your spending. Shop smarter.**

BudgetBasket is a mobile-first household budget and shopping manager. The current plan starts with the 73 product lines transcribed from the two grocery receipts supplied for this project—there is no demo basket. The receipt-derived list does not include garlic. Garlic appears only as an optional starter-catalog suggestion, never as a receipt item or preselected purchase.

## Run locally

Requirements: Node.js 22+ and npm (Capacitor 8 requires Node.js 22 for the Android tooling).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create and inspect a production build:

```bash
npm run build
npm run preview
```

The project uses React, TypeScript, and Vite. Open the project folder in VS Code; the included TypeScript configuration and npm scripts are ready to use. `node_modules/`, build output, local environment files, and OS metadata are excluded by `.gitignore`.

## Imported receipt data

- **73 item lines** are transcribed from the two receipt photos: 47 from Receipt A and 26 from Receipt B.
- Receipt B shows a date of **31 Aug 2026**, gross sales of **₹4,560.18**, discount/savings of **₹834.25**, and net total of **₹3,725.93**.
- Receipt A's date, retailer and printed total are not legible enough to verify. Its **₹4,896.64** is the sum of the line values transcribed from the image, not a confirmed printed total.
- Retailer/source is left as **Review source** because the photos do not clearly establish CSD vs local market. Source can be changed item by item.
- Several receipt names are flagged **Check receipt name** and remain editable.
- Imported prices are past-paid amounts, not live store quotes. Review the imported quantities and recurrence for your new monthly plan.

## Working features

- Deterministic monthly totals, budget balance, buffer target and category breakdown.
- Item-by-item purchase sources for CSD, local market, online, unassigned/review, and discontinued.
- Multi-select mode to keep items in the plan or discontinue a batch; changes require an explicit action.
- Add/edit/remove items, categories, priorities, quantities, recurring intervals and optional comparison prices.
- Purchase checklist with actual paid prices and per-item under/over-estimate feedback.
- Receipt details, editable receipt-derived item names, and transcription review flags.
- Inventory tracking with explicit approval before quantities are applied to the plan.
- Household, budget, buffer, category allocation and shopping-rule settings.
- Animated, five-step first-run app tour. Skip it at any time, replay it from the help button or Settings.
- Browser local-storage persistence. Shopping mode remains usable offline after the app has loaded.
- Optional categorized household starter catalog. It includes pantry, pulses, produce, dairy, cleaning, kitchen, personal care, first aid, baby/child, pet and home-maintenance reminders. Nothing is added until selected; new items have no invented price and stay out of budget totals until priced.
- Capacitor Android wrapper and GitHub Actions workflow for an installable debug APK.

## Online shopping and price limitations

- **JioMart is the default first retailer to search**, followed by other retailer search pages. Change the first retailer in Settings.
- Set a delivery city/area and optional six-digit PIN in Settings. The flow displays that locality, but retailer sites may require you to enter or confirm the PIN after opening their page.
- BudgetBasket opens retailer search pages; it does **not** scrape or verify live price, stock, delivery coverage, fees, or checkout totals. JioMart is prioritized as a local preference, not represented as guaranteed cheapest.
- You can save a price you personally checked. Quotes are dated and tagged with the configured locality for comparison by normalized unit price; they are not live feeds. Saving a quote does not automatically change the monthly estimate.
- Confirm the final price, availability and delivery fee on the retailer's site before purchasing.

## VS Code, GitHub branch, and live preview

Once pushed, the BudgetBasket code is directly usable from its feature branch without waiting for a pull request to merge. GitHub Pages deploys from `arena/budgetbasket-4899890-recovery`; the Android workflow runs on Arena feature branches (`arena/**`). Clone this branch with:

```bash
git clone --branch arena/budgetbasket-4899890-recovery --single-branch https://github.com/dfgtghu556-ops/grocery-.git
cd grocery-
npm ci
npm run dev
```

Open this folder in VS Code and run those commands in its integrated terminal. To push later edits directly to the same branch—without opening a PR—use:

```bash
git add .
git commit -m "Describe your change"
git push origin arena/budgetbasket-4899890-recovery
```

The configured GitHub Pages URL is `https://dfgtghu556-ops.github.io/grocery-/`; it was verified live after a successful Pages workflow deployment. The repository’s **Settings → Pages** source is **GitHub Actions**. This repository is private, so Pages availability depends on the account plan. The `github-pages` environment currently allows deployments from `main` and `arena/budgetbasket-4899890-recovery`; add another branch to that environment’s deployment allowlist before expecting Pages deployments from it.

Use your normal GitHub authentication method; never put access tokens or passwords in source files or commit history.

## Android APK

The Android wrapper uses Capacitor. To build locally, install Android Studio, Android SDK Platform 36, and JDK 21, then run:

```bash
npm install
npm run android:sync
cd android
./gradlew assembleDebug
```

The installable debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. On Windows, use `gradlew.bat assembleDebug` instead of `./gradlew`. A GitHub Actions workflow is configured to build after pushes to Arena feature branches when Actions are enabled; download its `budgetbasket-debug-apk` artifact from a successful run’s **Actions → Build BudgetBasket Android APK** page. The artifact is retained for 30 days. It is a debug-signed sideload build for testing—not a release-signed Play Store package.

## Scope and production deployment

This build runs client-side and stores data in the current browser. It does **not** provide Supabase persistence, authentication, cross-device sync, a hosted OCR service, live retailer pricing, or an AI assistant. Those require backend configuration and, for verified prices, retailer integrations. Do not treat receipt transcription or historic prices as verified current product data.

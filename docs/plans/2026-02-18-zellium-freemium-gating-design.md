# Zellium Freemium Gating Design

**Project:** zellium-fptpvo
**Date:** 2026-02-18
**Goal:** Let free users scan freely; gate history and symptom tracking behind premium.

## Strategy

Scanning works for everyone. Everything that involves tracking over time is premium.

## Current State

| Layer | Current Behavior | Status |
|-------|-----------------|--------|
| SplashPage | RevenueCat paywall check | Already DISABLED |
| LoadingPageAuth | RevenueCat `completeAccess` check → PaywallPage if no subscription | **ACTIVE — needs change** |
| Main ON_INIT_STATE | PaywallPage/PleaseRegisterPage redirects | Empty conditions, effectively inactive |
| Main Meals tab | PremuimContentWall (blur + lock + Subscribe) | Already in place |
| Main Symptoms tab | PremuimContentWall (blur + lock + Subscribe) | Already in place |
| LoadingPageSubmitFood | `free_feature_uses` insert | Already DISABLED |
| FoodPage | Full scan results + "Extend analysis" button | Already open |

## Change Required

**Single change: Disable the RevenueCat gate in LoadingPageAuth.**

In `LoadingPageAuth` ON_INIT_STATE, disable:
1. Action `t28th97s` — `database: read free_feature_uses`
2. Action `2cnun4xr` — `revenueCat: paywall (completeAccess)`
3. The conditional navigation that sends users to PaywallPage (`epxy2a0w`)

After disabling, all users flow: LoadingPageAuth → Main (always).

## Resulting User Flows

**Anonymous user:**
1. SplashPage → WelcomePage → Scan food → Full results
2. Meals/Symptoms tabs → PremuimContentWall → PaywallPage

**Registered free user:**
1. Login → LoadingPageAuth → Main (no paywall block)
2. Center FAB → Scan food → Full results
3. Meals tab → PremuimContentWall (history locked)
4. Symptoms tab → PremuimContentWall (symptoms locked)
5. Data saves silently → upgrading unlocks full history

**Premium user:**
1. Login → LoadingPageAuth → Main → Full access

## What Stays Unchanged

- PremuimContentWall component (blur + lock + "Subscribe Now")
- PaywallPage (reachable from premium walls, Settings)
- Scan flow (WelcomePage → AddFoodPage → LoadingPageSubmitFood → FoodPage)
- FoodPage "Extend analysis" button
- BottomNavBar (Meals, +Scan, Symptoms)
- LoadingPageCorrelator (naturally gated — requires history + symptoms data)

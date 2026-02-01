# Pre-Demo Checklist

Use this checklist before running the QAgent demo to ensure everything is ready.

---

## 1. Environment Setup

### API Keys
Run this command to verify all required environment variables are set:

```bash
# Check for required API keys
echo "Checking environment variables..."
[ -n "$BROWSERBASE_API_KEY" ] && echo "✓ BROWSERBASE_API_KEY" || echo "✗ BROWSERBASE_API_KEY missing"
[ -n "$BROWSERBASE_PROJECT_ID" ] && echo "✓ BROWSERBASE_PROJECT_ID" || echo "✗ BROWSERBASE_PROJECT_ID missing"
[ -n "$OPENAI_API_KEY" ] && echo "✓ OPENAI_API_KEY" || echo "✗ OPENAI_API_KEY missing"
[ -n "$REDIS_URL" ] && echo "✓ REDIS_URL" || echo "✗ REDIS_URL missing"
[ -n "$VERCEL_TOKEN" ] && echo "✓ VERCEL_TOKEN" || echo "✗ VERCEL_TOKEN missing"
[ -n "$VERCEL_PROJECT_ID" ] && echo "✓ VERCEL_PROJECT_ID" || echo "✗ VERCEL_PROJECT_ID missing"
[ -n "$WANDB_API_KEY" ] && echo "✓ WANDB_API_KEY" || echo "✗ WANDB_API_KEY missing"
```

- [ ] `BROWSERBASE_API_KEY` - Set and valid
- [ ] `BROWSERBASE_PROJECT_ID` - Set and valid
- [ ] `OPENAI_API_KEY` - Set and valid (check balance)
- [ ] `REDIS_URL` - Set and valid
- [ ] `VERCEL_TOKEN` - Set and valid
- [ ] `VERCEL_PROJECT_ID` - Set and valid
- [ ] `WANDB_API_KEY` - Set and valid

### Local Environment
- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Dependencies installed (`pnpm install`)
- [ ] TypeScript compiles (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)

---

## 2. Services Status

### Browserbase
```bash
# Verify Browserbase connection (requires API key)
curl -s -H "Authorization: Bearer $BROWSERBASE_API_KEY" \
  https://api.browserbase.com/v1/sessions | head -1
```
- [ ] API accessible
- [ ] Session quota available
- [ ] Account in good standing

### Redis
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
# Expected: PONG
```
- [ ] Redis server accessible
- [ ] Vector index exists (`FT._LIST`)
- [ ] No memory issues

### Vercel
```bash
# Check Vercel project status
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID" | jq .name
```
- [ ] API accessible
- [ ] Project exists
- [ ] Deployment quota available

### W&B Weave
```bash
# Verify Weave connection (will init if valid)
python -c "import weave; weave.init('test')" 2>/dev/null && echo "✓ Weave OK"
```
- [ ] API key valid
- [ ] Project exists or can be created

---

## 3. Demo App State

### Reset Demo App to Buggy State
The demo app should have all 3 bugs present:

**Bug 1: Check cart/page.tsx line 109**
```bash
grep -n "onClick" app/cart/page.tsx | grep checkout-button
# Should NOT find onClick={handleCheckout} on the checkout button
```
- [ ] Checkout button missing onClick handler

**Bug 2: Check api/checkout/route.ts line 23**
```bash
grep "api/payments" app/api/checkout/route.ts
# Should find the call to non-existent /api/payments
```
- [ ] API calls non-existent /api/payments endpoint

**Bug 3: Check signup/page.tsx line 64**
```bash
grep "preferences.newsletter" app/signup/page.tsx
# Should find the null reference access
```
- [ ] Null reference on preferences.newsletter

### Git Status
```bash
git status
# Should be clean or on a demo branch
```
- [ ] Working directory clean
- [ ] On correct branch (main or demo)
- [ ] No uncommitted changes

---

## 4. Local Testing

### Start Demo App
```bash
pnpm dev
# Open http://localhost:3000
```
- [ ] App starts without errors
- [ ] Home page loads
- [ ] Cart page shows items
- [ ] Checkout button visible (but broken)
- [ ] Signup page loads

### Verify Bugs Exist
- [ ] Click checkout button → nothing happens (Bug 1)
- [ ] Check browser console for no errors yet (Bug 2 needs API call)
- [ ] Signup form visible (Bug 3 triggers on submit)

### Run Dry Demo
```bash
pnpm run demo:dry
```
- [ ] Banner displays correctly
- [ ] Bug list shows 3 bugs
- [ ] Tech stack displays
- [ ] Loop diagram renders

---

## 5. Dashboard Setup

### Start Marimo Dashboard
```bash
pnpm run dashboard
# Or: marimo run dashboard/app.py
```
- [ ] Dashboard opens in browser
- [ ] Charts render with mock data
- [ ] "Use mock data" checkbox works
- [ ] All sections visible

### Pre-seed Data (Optional)
If using live Weave data:
- [ ] Run a test cycle first to populate data
- [ ] Verify data appears in dashboard

---

## 6. Backup Plan

### Recorded Demo
- [ ] Backup video recorded and tested
- [ ] Video plays correctly
- [ ] Audio (if any) is clear

### Screenshots
- [ ] Screenshot of buggy app (checkout button not working)
- [ ] Screenshot of QAgent running
- [ ] Screenshot of fix being applied
- [ ] Screenshot of working app
- [ ] Screenshot of dashboard with metrics

### Manual Fallback
If automation fails, be prepared to:
- [ ] Show code with bugs highlighted
- [ ] Manually apply the fix
- [ ] Show before/after diff
- [ ] Display pre-captured Weave traces

---

## 7. Network & Performance

### Internet Connection
- [ ] Stable connection
- [ ] VPN disabled (if causing issues)
- [ ] Firewall allows API access

### Performance
- [ ] Close unnecessary applications
- [ ] Terminal window visible and large enough
- [ ] Browser zoom at 100%
- [ ] Screen resolution appropriate for projection

---

## 8. Final Verification

### Complete System Check
```bash
# Run all checks in sequence
pnpm lint && pnpm test && pnpm run demo:dry
```
- [ ] Lint passes
- [ ] Tests pass (165 tests)
- [ ] Dry run completes

### Timing Practice
- [ ] Run through demo script once
- [ ] Verify timing fits in 3 minutes
- [ ] Practice transitions

---

## Quick Reference Commands

```bash
# Start everything
pnpm dev                  # Demo app
pnpm run dashboard        # Marimo dashboard

# Run demo
pnpm run demo             # Full demo
pnpm run demo:dry         # Dry run
pnpm run demo --quick     # Fewer iterations

# Troubleshooting
pnpm lint                 # Check for errors
pnpm test                 # Run tests
git status                # Check git state
```

---

## Troubleshooting

### "OPENAI_API_KEY not set"
```bash
export OPENAI_API_KEY=sk-...
```

### "Browserbase session timeout"
- Check API key is valid
- Verify account has session quota
- Try creating session manually via API

### "Redis connection refused"
- Verify REDIS_URL is correct
- Check Redis server is running
- Test with `redis-cli ping`

### "Vercel deployment failed"
- Check VERCEL_TOKEN is valid
- Verify project ID exists
- Check deployment quota

### "Weave not logging"
- Verify WANDB_API_KEY is set
- Check W&B account status
- Try `weave.init()` manually

---

## Sign-off

**Pre-demo checklist completed by:** ________________

**Date:** ________________

**Ready for demo:** [ ] Yes [ ] No - Issues: ________________

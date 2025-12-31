# Daily Review Modal - Testing Guide

## 🧪 How to Test the New Features

### 1. Test Draft Persistence (CRITICAL)

**Scenario 1: App Force Close**
1. Open app and trigger daily review modal
2. Complete Step 1 (intro), proceed to Step 2
3. Select a status for 1-2 items
4. **Force close the app** (swipe away from app switcher)
5. Reopen app
6. Trigger daily review modal again
7. ✅ **Expected:** See "Resume Previous Review? 💜" dialog
8. Tap "Resume"
9. ✅ **Expected:** Review state restored exactly where you left off

**Scenario 2: Modal Dismissal**
1. Start review, make some selections
2. Tap the X button (top right)
3. ✅ **Expected:** See "Save Your Progress? 💜" dialog with 3 options
4. Tap "Save & Exit"
5. Reopen modal
6. ✅ **Expected:** Resume prompt appears

**Scenario 3: Start Fresh**
1. Have an existing draft
2. Open review modal → see resume prompt
3. Tap "Start Fresh"
4. ✅ **Expected:** Review starts from beginning, old draft cleared

---

### 2. Test Network Retry (CRITICAL)

**Scenario 1: Offline Submission**
1. Complete entire review flow
2. **Enable Airplane Mode** before submitting
3. Tap "Submit Review ✓"
4. ✅ **Expected:** 
   - See "Submitting..." for ~6 seconds (3 retries)
   - Then see "Saved Locally 💜" alert
   - Modal stays open
5. **Disable Airplane Mode**
6. Tap "Submit Review ✓" again
7. ✅ **Expected:** Submission succeeds, modal closes

**Scenario 2: Flaky Network**
1. Use network throttling (developer tools)
2. Submit review
3. ✅ **Expected:** Multiple retry attempts, then success or local save

---

### 3. Test Haptic Feedback

**What to Feel:**
1. Tap "Ready to Reflect →" → **Medium haptic**
2. Select any status option → **Light haptic**
3. Select category chip → **Light haptic**
4. Type replacement text until 10 chars → **Success haptic** (stronger)
5. Successfully submit → **Success haptic**

**How to Test:**
- Ensure device is NOT in silent/vibrate mode
- Feel for tactile feedback with each interaction

---

### 4. Test Empathetic Copy

**Visual Check:**
1. ✅ Intro says "Hey! Let's check in about yesterday"
2. ✅ Button says "Ready to Reflect →" (not "Continue")
3. ✅ Status option says "Did something else" (not "Replaced it")
4. ✅ Replacement header: "💡 Tell us what you did instead"
5. ✅ Error message: "A bit more detail helps us understand you better 💜"
6. ✅ Character counter turns GREEN at 10+ chars with checkmark

---

### 5. Test Accessibility

**iOS (VoiceOver):**
1. Settings → Accessibility → VoiceOver → ON
2. Navigate through review modal
3. ✅ Each button announces its label
4. ✅ Hints provide context (e.g., "Mark that you completed this action")

**Android (TalkBack):**
1. Settings → Accessibility → TalkBack → ON
2. Navigate through review modal
3. ✅ Same as iOS checks

---

### 6. Test Edge Cases

**Scenario 1: Draft Expiry**
1. Create a draft
2. Manually change device date to 3 days later
3. Open review modal
4. ✅ **Expected:** No resume prompt (draft expired)

**Scenario 2: Rapid State Changes**
1. Select status → immediately change → change again rapidly
2. ✅ **Expected:** Only one draft saved (debouncing works)

**Scenario 3: Invalid Replacement Text**
1. Select "Did something else"
2. In replacement step, type only "aaa"
3. ✅ **Expected:** Error: "Please tell us a bit more about what you did 💭"
4. Type "aaaaaaaaaa" (10 a's)
5. ✅ **Expected:** Same error (repeated chars)
6. Type "Had a smoothie"
7. ✅ **Expected:** Green checkmark, valid

---

## 📱 Quick Test Checklist

Copy this for each test run:

```
Daily Review Modal - Test Run

[ ] Draft saves automatically
[ ] Resume prompt appears after force close
[ ] Modal dismissal shows save options
[ ] Network retry works in airplane mode
[ ] Haptic feedback on all interactions
[ ] Empathetic copy throughout
[ ] Character counter turns green at 10 chars
[ ] Accessibility labels read correctly
[ ] Expired drafts auto-clear
[ ] Invalid text shows helpful errors
[ ] Successful submit clears draft
[ ] No TypeScript/runtime errors

Issues Found:
_____________________
_____________________

Tested By: _________
Date: ______________
```

---

## 🐛 Known Behaviors (Not Bugs)

1. **3-second delay before auto-save**
   - Intentional debouncing to reduce writes

2. **Resume prompt every time**
   - Only shows if valid, non-expired draft exists

3. **Modal stays open after network fail**
   - Intentional - lets user retry manually

4. **Green checkmark at 10 chars**
   - Success threshold, not final validation

---

## 🚨 What to Report as Bugs

1. Draft NOT restored after force close
2. No haptic feedback on interactions
3. Network errors not retried
4. Accessibility labels missing/incorrect
5. Copy still says old text ("Replaced it", etc.)
6. Modal closes immediately on dismissal (no save prompt)
7. TypeScript errors in console
8. App crashes during review flow

---

## 📊 Success Criteria

✅ **PASS if:**
- All checklist items work
- No crashes or errors
- Haptic feedback feels natural
- Copy is warm and empathetic
- Users can recover from all edge cases

❌ **FAIL if:**
- Draft lost on force close
- Network failures lose data
- Accessibility broken
- Copy still clinical
- Any critical crash

---

**Next Steps After Testing:**
1. Document any issues found
2. Fix critical bugs
3. Iterate on UX based on feedback
4. Prepare for production release

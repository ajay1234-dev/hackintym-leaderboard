# 🎯 Card Submission & Admin Execution System - Integration Guide

## ✅ What's Been Created

### 1. **TypeScript Types** (`src/types/index.ts`)

```typescript
export interface PendingCardSubmission {
  id: string;
  teamId: string;
  teamName: string;
  cardId: string;
  targetTeamId?: string;
  submittedAt: number;
}

export interface CardWindowState {
  isOpen: boolean;
  endsAt: number | null;
  duration: number; // in seconds
}
```

### 2. **Card Submission Hook** (`src/hooks/useCardSubmission.ts`)

- ✅ Real-time listener for pending submissions
- ✅ Card window state management
- ✅ Timer countdown
- ✅ Validation logic
- ✅ Submit/delete/execute functions

### 3. **Admin Panel Component** (`src/components/dashboard/PendingCardsPanel.tsx`)

- ✅ Display all pending submissions
- ✅ Execute single/all/selected cards
- ✅ Window controls (open/close/timer)
- ✅ Real-time updates
- ✅ Selection system

### 4. **Team Submission Component** (`src/components/dashboard/TeamCardSubmission.tsx`)

- ✅ Card selection UI
- ✅ Target team selection (for ATTACK cards)
- ✅ Validation & error handling
- ✅ Success feedback
- ✅ Window status display

---

## 🔧 Integration Steps

### **STEP 1: Add PendingCardsPanel to Control Room**

Open `src/app/control-room/page.tsx` and find the JSX return section (around line 965+).

Add the PendingCardsPanel near the top of the control room, perhaps after the header or in a prominent position:

```tsx
// Around line 1000-1100, add this section:

{
  /* CARD SUBMISSION SYSTEM */
}
<PendingCardsPanel
  pendingSubmissions={pendingSubmissions}
  cardWindow={cardWindow}
  timeRemaining={timeRemaining}
  teams={teams}
  cards={cards}
  onExecute={executePendingCard}
  onExecuteAll={executeAllPendingCards}
  onDelete={handleDeletePending}
  onClearAll={handleClearAllSubmissions}
  onOpenWindow={handleOpenCardWindow}
  onCloseWindow={handleCloseCardWindow}
/>;
```

**Suggested Location:** Place it right after the "Master Timer" section or create a new dedicated section for "Card Management".

---

### **STEP 2: Add TeamCardSubmission to Dashboard (Optional)**

If you want teams to see the submission UI on the main dashboard, add it to `src/app/page.tsx`:

```tsx
import { TeamCardSubmission } from "@/components/dashboard/TeamCardSubmission";
import { useCardSubmission } from "@/hooks/useCardSubmission";

// Inside the DashboardPage component:
const {
  pendingSubmissions,
  cardWindow,
  timeRemaining,
  userSubmission,
  hasTeamSubmitted,
  submitCard,
} = useCardSubmission({ teams, cards });

// Then render it where appropriate:
<TeamCardSubmission
  team={currentTeam} // You need to identify the current team
  cards={cards}
  allTeams={teams}
  cardWindow={cardWindow}
  timeRemaining={timeRemaining}
  userSubmission={userSubmission}
  hasTeamSubmitted={hasTeamSubmitted}
  onSubmitCard={submitCard}
/>;
```

---

### **STEP 3: Firestore Setup**

The system will automatically create these Firestore collections/documents:

**Collections:**

- `pendingCards` - Stores all pending card submissions

**Documents:**

- `globalState/cardWindow` - Stores card window state

**Initial Setup (Run once in Firebase Console):**

```javascript
// Create the cardWindow document with default values
db.collection("globalState").doc("cardWindow").set({
  isOpen: false,
  endsAt: null,
  duration: 120,
});
```

Or it will be created automatically when admin first opens a window.

---

## 🎮 How It Works

### **Team Flow:**

1. Admin opens card submission window (1, 2, or 5 minutes)
2. Team sees "Submit Card" section with timer
3. Team selects a card from their owned cards
4. If ATTACK card, team must select target
5. Team clicks "Submit Card"
6. Submission appears in admin panel
7. Team sees "Card Submitted ✅" message

### **Admin Flow:**

1. Admin opens card window (click "Open 1/2/5 min")
2. Timer starts counting down
3. Teams submit cards (appear in real-time)
4. Admin reviews submissions
5. Admin can:
   - Execute single card (click ▶️)
   - Execute selected cards (checkbox + "Execute Selected")
   - Execute all cards ("Execute All")
   - Delete individual submissions (click ❌)
   - Clear all submissions
   - Close window early
6. Cards are executed with proper effects
7. Toast notifications appear
8. Leaderboard updates

---

## 🔐 Validation Rules

✅ **One submission per team per window**  
✅ **ATTACK cards require target**  
✅ **Cannot submit when window is closed**  
✅ **Cannot submit duplicate cards**  
✅ **Card must exist and be owned by team**

---

## 🎨 UI Features

### **Admin Panel:**

- 🟢 Window status indicator (OPEN/CLOSED)
- ⏱️ Countdown timer
- 📊 Submission count
- ☑️ Select all/individual submissions
- ▶️ Execute buttons
- 🗑️ Delete/Clear buttons
- 🎨 Rarity-based card colors (cyan/purple/gold)
- 🔄 Real-time updates

### **Team Panel:**

- 🟢 Window status with timer
- 🎴 Card grid selection
- 🎯 Target dropdown (for ATTACK cards)
- ✅ Success message
- ❌ Error messages
- 🚫 Disabled state when already submitted
- 📱 Responsive design

---

## 🔊 Sound & Feedback

To add sound effects, integrate with the existing sound manager:

```typescript
import { playCardSound, playCelebrationSound } from "@/lib/soundManager";

// In executePendingCard function:
if (card.rarity === "LEGENDARY") {
  playCelebrationSound();
} else {
  playCardSound();
}
```

---

## 🧪 Testing Checklist

### **Test Case 1: Basic Submission**

- [ ] Admin opens 2-minute window
- [ ] Team selects card and submits
- [ ] Appears in admin panel
- [ ] Admin executes
- [ ] Effect applied correctly
- [ ] Toast notification shows

### **Test Case 2: ATTACK Card with Target**

- [ ] Team selects ATTACK card
- [ ] Target dropdown appears
- [ ] Team selects target
- [ ] Submission shows target in admin
- [ ] Admin executes
- [ ] Target team affected correctly

### **Test Case 3: Window Closes**

- [ ] Window opens
- [ ] Timer counts down to 0
- [ ] Submission disabled
- [ ] UI shows "Window Closed"

### **Test Case 4: Duplicate Prevention**

- [ ] Team submits card
- [ ] Try to submit again
- [ ] Shows "Already Submitted" message

### **Test Case 5: Batch Execution**

- [ ] Multiple teams submit
- [ ] Admin selects all
- [ ] Click "Execute Selected"
- [ ] All cards execute in order
- [ ] All effects applied

---

## 📊 Firestore Data Structure

### **pendingCards Collection:**

```javascript
{
  id: "auto-generated",
  teamId: "team_abc123",
  teamName: "Team Alpha",
  cardId: "card_xyz789",
  targetTeamId: "team_def456", // Optional
  submittedAt: 1712345678901
}
```

### **globalState/cardWindow Document:**

```javascript
{
  isOpen: true,
  endsAt: 1712345798901,
  duration: 120
}
```

---

## 🚀 Next Steps

1. **Add PendingCardsPanel to control room UI** (STEP 1 above)
2. **Test the complete flow** locally
3. **Deploy to Vercel**
4. **Test in production**
5. **Add sound effects** (optional)
6. **Add animations** (optional)
7. **Create tutorial** for teams

---

## 💡 Pro Tips

- **Window Duration**: Start with 2 minutes for first few rounds
- **Communication**: Announce window opening in Discord/chat
- **Review**: Always review submissions before executing
- **Backup**: Keep track of submissions in case of errors
- **Fair Play**: Close window early if all teams submitted

---

## 🐛 Troubleshooting

**Issue: Submissions not appearing**

- Check Firestore `pendingCards` collection
- Verify real-time listener is active
- Check browser console for errors

**Issue: Window not opening**

- Check `globalState/cardWindow` document exists
- Verify admin permissions
- Check Firebase console for errors

**Issue: Card not executing**

- Verify team owns the card
- Check if card data is valid
- Review `handleUseCard` function logic

---

## 📝 Summary

✅ **Fair system** - No spam, timed windows  
✅ **Admin control** - Full visibility and execution power  
✅ **Real-time** - Instant updates via Firestore  
✅ **Validated** - Prevents invalid submissions  
✅ **User-friendly** - Clear UI with feedback  
✅ **Scalable** - Works for any number of teams

---

**Ready to integrate! 🚀**

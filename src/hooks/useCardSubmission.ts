import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PendingCardSubmission, CardWindowState, Card, Team } from "@/types";

interface UseCardSubmissionProps {
  teams: Team[];
  cards: Card[];
}

export function useCardSubmission({ teams, cards }: UseCardSubmissionProps) {
  const [pendingSubmissions, setPendingSubmissions] = useState<
    PendingCardSubmission[]
  >([]);
  const [cardWindow, setCardWindow] = useState<CardWindowState>({
    isOpen: false,
    endsAt: null,
    duration: 120, // 2 minutes default
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [userSubmission, setUserSubmission] =
    useState<PendingCardSubmission | null>(null);

  // Listen to pending submissions
  useEffect(() => {
    const q = query(collection(db, "pendingCards"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const submissions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PendingCardSubmission[];

      setPendingSubmissions(
        submissions.sort((a, b) => b.submittedAt - a.submittedAt)
      );
    });

    return () => unsubscribe();
  }, []);

  // Listen to card window state
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "globalState", "cardWindow"),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setCardWindow({
            isOpen: data.isOpen || false,
            endsAt: data.endsAt || null,
            duration: data.duration || 120,
          });
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Update time remaining
  useEffect(() => {
    if (!cardWindow.isOpen || !cardWindow.endsAt) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor((cardWindow.endsAt! - Date.now()) / 1000)
      );
      setTimeRemaining(remaining);

      if (remaining === 0) {
        // Window closed
        setCardWindow((prev) => ({ ...prev, isOpen: false, endsAt: null }));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cardWindow.isOpen, cardWindow.endsAt]);

  // Check if team has already submitted
  const hasTeamSubmitted = (teamId: string): boolean => {
    return pendingSubmissions.some((s) => s.teamId === teamId);
  };

  // Submit a card
  const submitCard = async (
    teamId: string,
    teamName: string,
    cardId: string,
    targetTeamId?: string
  ) => {
    // Validation: Check if window is open
    if (!cardWindow.isOpen) {
      return { success: false, error: "Card submission window is closed" };
    }

    // Validation: Check if team already submitted
    if (hasTeamSubmitted(teamId)) {
      return {
        success: false,
        error: "Your team has already submitted a card this window",
      };
    }

    // Validation: Card must exist
    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      return { success: false, error: "Invalid card selected" };
    }

    // Validation: ATTACK cards require target
    if (
      (card.type === "ATTACK" ||
        card.effect === "deduct_points" ||
        card.effect === "freeze") &&
      !targetTeamId
    ) {
      return { success: false, error: "This card requires a target team" };
    }

    try {
      const submission: Omit<PendingCardSubmission, "id"> = {
        teamId,
        teamName,
        cardId,
        targetTeamId: targetTeamId || undefined,
        submittedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "pendingCards"), submission);

      const newSubmission: PendingCardSubmission = {
        id: docRef.id,
        ...submission,
      };

      setUserSubmission(newSubmission);
      return { success: true, submission: newSubmission };
    } catch (error) {
      console.error("Error submitting card:", error);
      return { success: false, error: "Failed to submit card" };
    }
  };

  // Execute a single pending card (Admin)
  const executePendingCard = async (submission: PendingCardSubmission) => {
    try {
      // This will be handled by the admin panel
      // Returns the submission data for execution
      return { success: true, submission };
    } catch (error) {
      console.error("Error executing card:", error);
      return { success: false, error: "Failed to execute card" };
    }
  };

  // Delete a pending submission (Admin)
  const deletePendingSubmission = async (submissionId: string) => {
    try {
      await deleteDoc(doc(db, "pendingCards", submissionId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting submission:", error);
      return { success: false, error: "Failed to delete submission" };
    }
  };

  // Open card window (Admin)
  const openCardWindow = async (durationSeconds: number = 120) => {
    try {
      const endsAt = Date.now() + durationSeconds * 1000;
      await setDoc(doc(db, "globalState", "cardWindow"), {
        isOpen: true,
        endsAt,
        duration: durationSeconds,
      });
      return { success: true };
    } catch (error) {
      console.error("Error opening card window:", error);
      return { success: false, error: "Failed to open card window" };
    }
  };

  // Close card window (Admin)
  const closeCardWindow = async () => {
    try {
      await setDoc(doc(db, "globalState", "cardWindow"), {
        isOpen: false,
        endsAt: null,
        duration: cardWindow.duration,
      });
      return { success: true };
    } catch (error) {
      console.error("Error closing card window:", error);
      return { success: false, error: "Failed to close card window" };
    }
  };

  // Clear all pending submissions (Admin)
  const clearAllSubmissions = async () => {
    try {
      const q = query(collection(db, "pendingCards"));
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      return { success: true };
    } catch (error) {
      console.error("Error clearing submissions:", error);
      return { success: false, error: "Failed to clear submissions" };
    }
  };

  return {
    pendingSubmissions,
    cardWindow,
    timeRemaining,
    userSubmission,
    hasTeamSubmitted,
    submitCard,
    executePendingCard,
    deletePendingSubmission,
    openCardWindow,
    closeCardWindow,
    clearAllSubmissions,
  };
}

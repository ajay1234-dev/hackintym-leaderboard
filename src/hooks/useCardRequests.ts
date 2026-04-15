"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, Team } from "@/types";

export interface CardRequest {
  id: string;
  teamId: string;
  teamName: string;
  cardId: string;
  targetTeamId?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

export interface CardRequestWindow {
  isOpen: boolean;
  deadline: number | null;
  duration?: number;
}

interface UseCardRequestsProps {
  teams: Team[];
  cards: Card[];
}

export function useCardRequests({ teams, cards }: UseCardRequestsProps) {
  const [cardRequests, setCardRequests] = useState<CardRequest[]>([]);
  const [requestWindow, setRequestWindow] = useState<CardRequestWindow>({
    isOpen: false,
    deadline: null,
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Listen to card requests in real-time
  useEffect(() => {
    const q = query(collection(db, "cardRequests"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CardRequest[];
      setCardRequests(requests.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsubscribe();
  }, []);

  // Listen to card request window state
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "globalState", "cardRequestWindow"),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setRequestWindow({
            isOpen: data.isOpen || false,
            deadline: data.deadline || null,
            duration: data.duration || 120,
          });
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!requestWindow.isOpen || !requestWindow.deadline) {
      setTimeRemaining(0);
      return;
    }
    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor((requestWindow.deadline! - Date.now()) / 1000)
      );
      setTimeRemaining(remaining);
      if (remaining === 0) {
        setRequestWindow((prev) => ({ ...prev, isOpen: false, deadline: null }));
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [requestWindow.isOpen, requestWindow.deadline]);

  // Helper: get all requests for a specific team
  const getTeamRequests = (teamId: string) =>
    cardRequests.filter((r) => r.teamId === teamId);

  // Helper: get a pending request for a specific card
  const getCardPendingRequest = (teamId: string, cardId: string) =>
    cardRequests.find(
      (r) => r.teamId === teamId && r.cardId === cardId && r.status === "pending"
    );

  // Helper: check if team has any pending request for a specific card
  const hasCardPendingRequest = (teamId: string, cardId: string) =>
    !!getCardPendingRequest(teamId, cardId);

  // Helper: get request status for a card (for participant display)
  const getCardRequestStatus = (
    teamId: string,
    cardId: string
  ): "none" | "pending" | "approved" | "rejected" => {
    const req = cardRequests.find(
      (r) => r.teamId === teamId && r.cardId === cardId
    );
    return req ? req.status : "none";
  };

  // Submit a card request (participant)
  const submitRequest = async (
    teamId: string,
    teamName: string,
    cardId: string,
    targetTeamId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!requestWindow.isOpen) {
      return { success: false, error: "Card request window is closed" };
    }

    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      return { success: false, error: "Invalid card" };
    }

    // Duplicate check: prevent same card from being re-requested if pending
    const duplicate = cardRequests.find(
      (r) => r.teamId === teamId && r.cardId === cardId && r.status === "pending"
    );
    if (duplicate) {
      return { success: false, error: "A pending request already exists for this card" };
    }

    const requiresTarget =
      card.type === "ATTACK" ||
      card.effect === "deduct_points" ||
      card.effect === "freeze";

    if (requiresTarget && !targetTeamId) {
      return { success: false, error: "This card requires a target team" };
    }

    try {
      const requestData: Omit<CardRequest, "id"> = {
        teamId,
        teamName,
        cardId,
        status: "pending",
        createdAt: Date.now(),
        ...(targetTeamId ? { targetTeamId } : {}),
      };
      await addDoc(collection(db, "cardRequests"), requestData);
      return { success: true };
    } catch (error) {
      console.error("Error submitting card request:", error);
      return { success: false, error: "Failed to submit request" };
    }
  };

  // Approve a request (admin) — updates status only; effect execution is caller's responsibility
  const approveRequest = async (
    requestId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateDoc(doc(db, "cardRequests", requestId), { status: "approved" });
      return { success: true };
    } catch (error) {
      console.error("Error approving request:", error);
      return { success: false, error: "Failed to approve" };
    }
  };

  // Reject a request (admin)
  const rejectRequest = async (
    requestId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateDoc(doc(db, "cardRequests", requestId), { status: "rejected" });
      return { success: true };
    } catch (error) {
      console.error("Error rejecting request:", error);
      return { success: false, error: "Failed to reject" };
    }
  };

  // Open the request window (admin)
  const openWindow = async (seconds: number) => {
    try {
      await setDoc(doc(db, "globalState", "cardRequestWindow"), {
        isOpen: true,
        deadline: Date.now() + seconds * 1000,
        duration: seconds,
      });
      return { success: true };
    } catch (error) {
      console.error("Error opening window:", error);
      return { success: false };
    }
  };

  // Close the request window (admin)
  const closeWindow = async () => {
    try {
      await setDoc(doc(db, "globalState", "cardRequestWindow"), {
        isOpen: false,
        deadline: null,
        duration: requestWindow.duration || 120,
      });
      return { success: true };
    } catch (error) {
      console.error("Error closing window:", error);
      return { success: false };
    }
  };

  return {
    cardRequests,
    requestWindow,
    timeRemaining,
    getTeamRequests,
    getCardPendingRequest,
    hasCardPendingRequest,
    getCardRequestStatus,
    submitRequest,
    approveRequest,
    rejectRequest,
    openWindow,
    closeWindow,
  };
}

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Team, Card } from '@/types';

interface CardDetectionResult {
  teamName: string;
  card: Card;
}

interface UseCardDetectionProps {
  teams: Team[];
  cards: Card[];
  onNewCardDetected: (result: CardDetectionResult) => void;
}

export function useCardDetection({ teams, cards, onNewCardDetected }: UseCardDetectionProps) {
  // Store previous state for comparison
  const previousTeamsRef = useRef<Map<string, string[]>>(new Map());
  const isInitialLoadRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Create a lookup map for cards by ID
  const getCardLookup = useCallback((cards: Card[]) => {
    const cardMap = new Map<string, Card>();
    cards.forEach(card => {
      cardMap.set(card.id, card);
    });
    return cardMap;
  }, []);

  // Compare card arrays using ID-based diff logic
  const detectNewCards = useCallback((currentTeams: Team[], previousTeamsMap: Map<string, string[]>, cardLookup: Map<string, Card>) => {
    const newCards: CardDetectionResult[] = [];

    currentTeams.forEach(team => {
      const currentCardIds = team.cardsOwned || [];
      const previousCardIds = previousTeamsMap.get(team.id) || [];

      // Find newly added cards (ID-based comparison)
      const newlyAddedCardIds = currentCardIds.filter(cardId => !previousCardIds.includes(cardId));

      // If we found new cards for this team
      if (newlyAddedCardIds.length > 0) {
        newlyAddedCardIds.forEach(cardId => {
          const card = cardLookup.get(cardId);
          if (card) {
            newCards.push({
              teamName: team.teamName,
              card
            });
          }
        });
      }
    });

    return newCards;
  }, []);

  // Main detection effect
  useEffect(() => {
    // Skip if teams or cards are not ready
    if (teams.length === 0 || cards.length === 0) {
      return;
    }

    // Handle initial load protection
    if (!hasInitializedRef.current) {
      // First time loading - just store the state, don't trigger celebrations
      const currentTeamsMap = new Map<string, string[]>();
      teams.forEach(team => {
        currentTeamsMap.set(team.id, team.cardsOwned || []);
      });
      previousTeamsRef.current = currentTeamsMap;
      hasInitializedRef.current = true;
      
      // Mark initial load as complete after a short delay
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 1000);
      
      return;
    }

    // Skip detection during initial load period
    if (isInitialLoadRef.current) {
      return;
    }

    const cardLookup = getCardLookup(cards);
    const newCards = detectNewCards(teams, previousTeamsRef.current, cardLookup);

    // Trigger celebrations for new cards
    if (newCards.length > 0) {
      newCards.forEach(newCard => {
        onNewCardDetected(newCard);
      });
    }

    // Update previous state for next comparison
    const currentTeamsMap = new Map<string, string[]>();
    teams.forEach(team => {
      currentTeamsMap.set(team.id, team.cardsOwned || []);
    });
    previousTeamsRef.current = currentTeamsMap;

  }, [teams, cards, detectNewCards, getCardLookup, onNewCardDetected]);

  // Reset function for testing or manual intervention
  const resetDetection = useCallback(() => {
    previousTeamsRef.current.clear();
    isInitialLoadRef.current = true;
    hasInitializedRef.current = false;
  }, []);

  return {
    resetDetection,
    isInitialized: hasInitializedRef.current,
    isPastInitialLoad: !isInitialLoadRef.current
  };
}

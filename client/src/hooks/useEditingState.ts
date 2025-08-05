import { useState, useCallback } from 'react';
import { isEqual } from 'lodash';

/**
 * A custom hook for managing form editing state
 * 
 * @param initialState The initial state object for the form
 * @returns An object containing form state and editing control methods
 */
export default function useEditingState<T>(initialState: T) {
  const [formState, setFormState] = useState<T>(initialState);
  const [originalState, setOriginalState] = useState<T>(initialState);
  const [isEditing, setIsEditing] = useState(false);

  // Check if there are changes between current and original state
  const hasChanges = !isEqual(formState, originalState);

  // Start editing and capture the original state for later comparison
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Cancel editing and revert to original state
  const cancelEditing = useCallback(() => {
    setFormState(originalState);
    setIsEditing(false);
  }, [originalState]);

  // Save changes by updating the original state to match current state
  const saveChanges = useCallback(() => {
    setOriginalState(formState);
    setIsEditing(false);
  }, [formState]);

  // Reset the form to initial state
  const resetForm = useCallback(() => {
    setFormState(initialState);
    setOriginalState(initialState);
    setIsEditing(false);
  }, [initialState]);

  // Update the original state with new data (e.g., from API)
  const updateOriginalState = useCallback((newState: T) => {
    setOriginalState(newState);
    setFormState(newState);
  }, []);

  return {
    formState,
    setFormState,
    originalState,
    isEditing,
    hasChanges,
    startEditing,
    cancelEditing,
    saveChanges,
    resetForm,
    updateOriginalState
  };
}
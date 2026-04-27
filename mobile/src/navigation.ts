// Navigation type declarations for React Navigation type-safety.
// Root stack: Tabs (bottom nav) + full-screen capture flow screens.

export type RootStackParamList = {
  Tabs: undefined;
  Capture: { draftId: string };
  DraftDetail: { draftId: string };
  Analyzing: { draftId: string };
  Review: { draftId: string };
};

export type TabParamList = {
  Today: undefined;
  CaptureTab: undefined;
  Drafts: undefined;
  Settings: undefined;
};

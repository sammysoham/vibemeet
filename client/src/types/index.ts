export type Gender = "MALE" | "FEMALE" | "UNSPECIFIED";
export type PreferredGender = "ANY" | Gender;
export type ChatModePreference = "VOICE_TEXT" | "TEXT_ONLY";

export type User = {
  id: string;
  email?: string | null;
  displayName: string;
  gender: Gender;
  isPremium: boolean;
  isGuest: boolean;
  acceptedTermsAt?: string | null;
  createdAt: string;
};

export type Friend = {
  id: string;
  createdAt: string;
  friend: {
    id: string;
    displayName: string;
    gender: Gender;
    isPremium: boolean;
  };
};

export type AuthSession = {
  token: string;
  user: User;
};

export type MatchPeer = {
  id: string;
  displayName: string;
  gender: Gender;
  isPremium: boolean;
};

export type MatchMode = "VOICE_TEXT" | "TEXT_ONLY";

export type ChatMessage = {
  id: string;
  roomId: string;
  sender: string;
  senderId: string;
  senderName: string;
  message?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  isAi?: boolean;
  createdAt: string;
};

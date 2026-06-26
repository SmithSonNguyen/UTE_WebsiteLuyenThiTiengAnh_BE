// src/interfaces/livekit.interface.ts
export interface LiveKitTokenRequest {
  roomName: string
  classId: string
  sessionNumber: number
}

export interface LiveKitTokenResponse {
  token: string
  serverUrl: string
  roomName: string
}

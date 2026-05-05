/**
 * Aqui van los contenedrores de solicitudes y respuestas
 */

export type RegisterRequest = {
  userName: string;
  email: string;
  password: string;
  birthDate: string;
};

export type RegisterResponse = {
  id: number;
  userName: string;
  email: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  email: string;
  token: string;
};

export type UpdateRequest = {
  userName: string
  password: string
  avatarUrl: string
};

export type UpdateResponse = {
  id: number
  userName: string
  password: string
};
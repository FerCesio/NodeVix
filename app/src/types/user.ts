/**
 * Aqui van los contenedrores de solicitudes y respuestas
 */

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: number;
  name: string;
  email: string;
};

export type LoginRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  name: string;
  email: string;
};
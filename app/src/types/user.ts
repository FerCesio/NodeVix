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
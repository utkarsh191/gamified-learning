import axios from "axios";

const API_URL = "import.meta.env.VITE_API_URL/auth";

export const registerUser = async (
  name: string,
  username: string,
  email: string,
  password: string
) => {
  const response = await axios.post(`${API_URL}/register`, {
    name,
    username,
    email,
    password,
  });

  return response.data;
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password,
  });

  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await axios.post(`${API_URL}/forgot-password`, {
    email,
  });

  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await axios.post(`${API_URL}/reset-password/${token}`, {
    password,
  });

  return response.data;
};

export const initiateSignup = async (
  name: string,
  username: string,
  email: string,
  password: string
) => {
  const response = await axios.post(`${API_URL}/signup/initiate`, {
    name,
    username,
    email,
    password,
  });

  return response.data;
};

export const verifySignupOtp = async (email: string, otp: string) => {
  const response = await axios.post(`${API_URL}/signup/verify-otp`, {
    email,
    otp,
  });

  return response.data;
};

export const resendSignupOtp = async (email: string) => {
  const response = await axios.post(`${API_URL}/signup/resend-otp`, {
    email,
  });

  return response.data;
};
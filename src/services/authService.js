// Mock implementation of authentication service
import { API_ENDPOINTS } from '@/config/api'

// Mock user data
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@example.com',
    isAdmin: true
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    name: 'Regular User',
    email: 'user@example.com',
    isAdmin: false
  }
];

export const authService = {
  async login(credentials) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate authentication logic
    const user = mockUsers.find(
      u => u.username === credentials.username && u.password === credentials.password
    );

    if (user) {
      // Generate a fake token
      const token = `mock-jwt-token-${Math.random().toString(36).substring(2, 15)}`;
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        },
        token
      };
    } else {
      // Simulate authentication failure
      const error = new Error('Invalid username or password');
      error.response = { status: 401 };
      throw error;
    }
  },

  async logout() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
}
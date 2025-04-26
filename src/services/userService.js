import api from './api'
import { API_ENDPOINTS } from '@/config/api'

const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    isActive: true,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    role: 'Manager',
    isActive: true,
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    role: 'User',
    isActive: false,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice.williams@example.com',
    role: 'User',
    isActive: true,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    firstName: 'Mike',
    lastName: 'Brown',
    email: 'mike.brown@example.com',
    role: 'Manager',
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
].map(user => ({
  ...user,
  name: `${user.firstName} ${user.lastName}`
}));

export const userService = {
  async getAll(filters = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let users = [...mockUsers];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchLower) || 
        u.email.toLowerCase().includes(searchLower) ||
        u.role.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filters.status && filters.status !== 'All') {
      const isActive = filters.status === 'Active';
      users = users.filter(u => u.isActive === isActive);
    }
    
    // Apply sorting
    if (filters.sort) {
      const [field, direction] = filters.sort.split('_');
      users.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (field === 'created') {
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
        }
        
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return users;
  },

  async create(userData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      ...userData,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      name: `${userData.firstName} ${userData.lastName}`
    };

    mockUsers.push(newUser);
    return newUser;
  },

  async update(id, userData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...mockUsers[index],
      ...userData,
      name: `${userData.firstName} ${userData.lastName}`
    };
    mockUsers[index] = updatedUser;
    
    return updatedUser;
  },

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const index = mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      mockUsers.splice(index, 1);
    }
  },

  async toggleStatus(id) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }

    mockUsers[index] = {
      ...mockUsers[index],
      isActive: !mockUsers[index].isActive
    };

    return mockUsers[index];
  },

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  },

  getRoleColor(role) {
    switch (role) {
      case 'Admin':
        return 'deep-purple';
      case 'Manager':
        return 'indigo';
      default:
        return 'blue';
    }
  },

  createEmpty() {
    return {
      id: null,
      firstName: '',
      lastName: '',
      email: '',
      role: 'User',
      isActive: true
    };
  },

  getAvailableRoles() {
    return ['Admin', 'Manager', 'User'];
  }
};
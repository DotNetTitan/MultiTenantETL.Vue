import { API_ENDPOINTS } from '@/config/api'

// Mock users data
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

// Sort functions
const sortFunctions = {
  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (a, b) => b.name.localeCompare(a.name),
  email_asc: (a, b) => a.email.localeCompare(b.email),
  email_desc: (a, b) => b.email.localeCompare(a.email),
  role_asc: (a, b) => a.role.localeCompare(b.role),
  role_desc: (a, b) => b.role.localeCompare(a.role),
  created_desc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  created_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
};

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
    if (filters.sort && sortFunctions[filters.sort]) {
      users.sort(sortFunctions[filters.sort]);
    } else {
      // Default sort by name
      users.sort(sortFunctions.name_asc);
    }

    return users;
  },

  async create(userData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      ...userData,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      name: `${userData.firstName} ${userData.lastName}`
    };

    mockUsers.push(newUser);
    return { ...newUser };
  },

  async update(id, userData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      const error = new Error('User not found');
      error.response = { status: 404 };
      throw error;
    }

    const updatedUser = {
      ...mockUsers[index],
      ...userData,
      name: `${userData.firstName} ${userData.lastName}`
    };
    
    mockUsers[index] = updatedUser;
    return { ...updatedUser };
  },

  async delete(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      const error = new Error('User not found');
      error.response = { status: 404 };
      throw error;
    }
    
    mockUsers.splice(index, 1);
    return true;
  },

  async toggleStatus(id) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      const error = new Error('User not found');
      error.response = { status: 404 };
      throw error;
    }

    const updatedUser = {
      ...mockUsers[index],
      isActive: !mockUsers[index].isActive
    };
    
    mockUsers[index] = updatedUser;
    return { ...updatedUser };
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
  },

  applyFilters(users, filters = {}) {
    let filtered = [...users];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) || 
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filters.status && filters.status !== 'All') {
      const isActive = filters.status === 'Active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    // Apply sorting
    if (filters.sort && sortFunctions[filters.sort]) {
      filtered.sort(sortFunctions[filters.sort]);
    }
    
    return filtered;
  }
};
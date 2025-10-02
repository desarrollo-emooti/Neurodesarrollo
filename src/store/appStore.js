import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // UI State
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'light',
  loading: false,
  notifications: [],
  
  // Data State
  centers: [],
  users: [],
  students: [],
  testAssignments: [],
  testResults: [],
  agendaEvents: [],
  devices: [],
  inventoryItems: [],
  subscriptions: [],
  invoices: [],
  
  // Filters and Search
  searchQuery: '',
  currentFilters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 0,
  
  // Selected Items
  selectedItems: [],
  selectedCenter: null,
  selectedStudent: null,
  
  // Modal State
  modals: {
    createUser: false,
    editUser: false,
    createStudent: false,
    editStudent: false,
    createCenter: false,
    editCenter: false,
    createTestAssignment: false,
    editTestAssignment: false,
    createTestResult: false,
    editTestResult: false,
    createAgendaEvent: false,
    editAgendaEvent: false,
    createDevice: false,
    editDevice: false,
    createInventoryItem: false,
    editInventoryItem: false,
    createSubscription: false,
    editSubscription: false,
    createInvoice: false,
    editInvoice: false,
    deleteConfirm: false,
    bulkAction: false,
  },
  
  // Actions - UI
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setTheme: (theme) => set({ theme }),
  setLoading: (loading) => set({ loading }),
  
  // Actions - Notifications
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now() }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearNotifications: () => set({ notifications: [] }),
  
  // Actions - Data
  setCenters: (centers) => set({ centers }),
  setUsers: (users) => set({ users }),
  setStudents: (students) => set({ students }),
  setTestAssignments: (assignments) => set({ testAssignments: assignments }),
  setTestResults: (results) => set({ testResults: results }),
  setAgendaEvents: (events) => set({ agendaEvents: events }),
  setDevices: (devices) => set({ devices }),
  setInventoryItems: (items) => set({ inventoryItems: items }),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setInvoices: (invoices) => set({ invoices }),
  
  // Actions - Filters and Search
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCurrentFilters: (filters) => set({ currentFilters: filters }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  clearFilters: () => set({ 
    searchQuery: '', 
    currentFilters: {}, 
    sortBy: 'createdAt', 
    sortOrder: 'desc' 
  }),
  
  // Actions - Pagination
  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),
  setTotalItems: (totalItems) => set({ totalItems }),
  resetPagination: () => set({ currentPage: 1 }),
  
  // Actions - Selected Items
  setSelectedItems: (items) => set({ selectedItems: items }),
  addSelectedItem: (item) => set((state) => ({
    selectedItems: [...state.selectedItems, item]
  })),
  removeSelectedItem: (item) => set((state) => ({
    selectedItems: state.selectedItems.filter(i => i.id !== item.id)
  })),
  clearSelectedItems: () => set({ selectedItems: [] }),
  setSelectedCenter: (center) => set({ selectedCenter: center }),
  setSelectedStudent: (student) => set({ selectedStudent: student }),
  
  // Actions - Modals
  openModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: true }
  })),
  closeModal: (modalName) => set((state) => ({
    modals: { ...state.modals, [modalName]: false }
  })),
  closeAllModals: () => set((state) => {
    const closedModals = {};
    Object.keys(state.modals).forEach(key => {
      closedModals[key] = false;
    });
    return { modals: closedModals };
  }),
  
  // Computed values
  getFilteredData: (dataType) => {
    const state = get();
    let data = state[dataType] || [];
    
    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      data = data.filter(item => {
        // Search in common fields
        const searchableFields = ['fullName', 'name', 'email', 'code', 'studentId'];
        return searchableFields.some(field => 
          item[field] && item[field].toLowerCase().includes(query)
        );
      });
    }
    
    // Apply current filters
    Object.entries(state.currentFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        data = data.filter(item => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      }
    });
    
    // Apply sorting
    data.sort((a, b) => {
      const aValue = a[state.sortBy];
      const bValue = b[state.sortBy];
      
      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return data;
  },
  
  getPaginatedData: (data) => {
    const state = get();
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return data.slice(startIndex, endIndex);
  },
  
  getTotalPages: () => {
    const state = get();
    return Math.ceil(state.totalItems / state.itemsPerPage);
  },
  
  // Utility functions
  resetAppState: () => set({
    sidebarOpen: true,
    sidebarCollapsed: false,
    loading: false,
    notifications: [],
    centers: [],
    users: [],
    students: [],
    testAssignments: [],
    testResults: [],
    agendaEvents: [],
    devices: [],
    inventoryItems: [],
    subscriptions: [],
    invoices: [],
    searchQuery: '',
    currentFilters: {},
    sortBy: 'createdAt',
    sortOrder: 'desc',
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    selectedItems: [],
    selectedCenter: null,
    selectedStudent: null,
    modals: {
      createUser: false,
      editUser: false,
      createStudent: false,
      editStudent: false,
      createCenter: false,
      editCenter: false,
      createTestAssignment: false,
      editTestAssignment: false,
      createTestResult: false,
      editTestResult: false,
      createAgendaEvent: false,
      editAgendaEvent: false,
      createDevice: false,
      editDevice: false,
      createInventoryItem: false,
      editInventoryItem: false,
      createSubscription: false,
      editSubscription: false,
      createInvoice: false,
      editInvoice: false,
      deleteConfirm: false,
      bulkAction: false,
    },
  }),
}));

export default useAppStore;

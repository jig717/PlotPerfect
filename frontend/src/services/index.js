import api from './api'

export const authService = {
  login: data => api.post('/user/login', data),
  signup: data => api.post('/user/register', data),
  me:() => api.get('/user/me'),
}

export const inquiryService = {
  send: data => api.post('/inquiries', data),             
  getMine: userId => api.get(`/inquiries/user/${userId}`),
  getAll: () => api.get('/inquiries/all'),                
  delete: id => api.delete(`/inquiries/${id}`),           
  respond: (id, msg) => api.patch(`/inquiries/${id}/respond`, { message: msg }),
  getForAgent: () => api.get('/inquiries/agent'),         
};

export const threadService = {
  create: data => api.post('/threads', data),
  getMine: params => api.get('/threads', { params }),
  getById: id => api.get(`/threads/${id}`),
  getByInquiryId: inquiryId => api.get(`/threads/inquiry/${inquiryId}`),
  getMessages: (threadId) => api.get(`/threads/${threadId}/messages`),
  sendMessage: (threadId, payload) => api.post(`/threads/${threadId}/messages`, payload),
  markRead: (threadId) => api.post(`/threads/${threadId}/read`),
  update: (threadId, payload) => api.patch(`/threads/${threadId}`, payload),
};
export const propertyService = {
  getAll: params => api.get('/property/all', { params }),
  getById: id => api.get(`/property/${id}`),
  create: data => api.post('/property', data),
  update: (id, data) => api.put(`/property/${id}`, data),
  delete: id => api.delete(`/property/${id}`),
  myListings: () => api.get('/property/my-listings'),
  getByOwner: (ownerId) => api.get(`/property/owner/${ownerId}`),
  uploadImages: (propertyId, formData) => api.post('/propertyimage', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  }),
};


export const userService = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: data => api.put('/user/profile', data),
  getSaved: (userId) => api.get(`/favorite/${userId}`),      
  saveProperty: (userId, propertyId) => api.post('/favorite', { userId, propertyId }),
  unsave: (favoriteId) => api.delete(`/favorite/${favoriteId}`),
  getVisits: (params) => api.get('/visits/buyer', { params }),
  cancelVisit: (visitId) => api.patch(`/visits/${visitId}/status`, { status: 'CANCELLED' }),
};

export const agentService = { 
  getStats: () => api.get('/agent/stats'),
  getDailyViews: () => api.get('/agent/daily-views'),
  getLeadSources: () => api.get('/agent/lead-sources'),
};


/* ── SUPPORT ── */
export const supportService = {
  createTicket: (data) => api.post('/support', data),   
  getAllTickets: () => api.get('/support'),
  updateTicket: (id, data) => api.put(`/support/${id}`, data),
};

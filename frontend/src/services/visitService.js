import api from "./api";

const normalizeCreatePayload = (data = {}) => {
  const propertyId = data.propertyId || data.property || data.property_id || null;
  const buyerId = data.buyerId || data.buyer_id || data.userId || data.user || null;
  const agentId = data.agentId || data.agent_id || data.ownerId || data.owner_id || null;
  const scheduledDateValue = data.scheduledDate || data.scheduled_date || null;
  const parsedDate = scheduledDateValue ? new Date(scheduledDateValue) : null;
  const normalizedScheduledDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : scheduledDateValue;

  return {
    ...data,
    ...(propertyId ? { propertyId, property: propertyId, property_id: propertyId } : {}),
    ...(buyerId ? { buyerId, buyer_id: buyerId, user: buyerId, userId: buyerId } : {}),
    ...(agentId ? { agentId, agent_id: agentId, ownerId: agentId, owner_id: agentId } : {}),
    ...(normalizedScheduledDate
      ? { scheduledDate: normalizedScheduledDate, scheduled_date: normalizedScheduledDate }
      : {}),
    ...(typeof data.notes === "string" ? { notes: data.notes.trim() } : {}),
  };
};

const visitService = {
  create: (data) => api.post("/visits", normalizeCreatePayload(data)),
  getBuyerVisits: (params) => api.get("/visits/buyer", { params }),
  getAgentVisits: (params) => api.get("/visits/agent", { params }),
  update: (id, data) => api.put(`/visits/${id}`, data),
  updateStatus: (id, status) => api.patch(`/visits/${id}/status`, { status }),
};

export default visitService;

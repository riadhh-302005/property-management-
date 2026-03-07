// API base URL
export const API = "https://property-management-mg0p.onrender.com/api";

// User roles
export const ROLES = {
  LANDLORD: 'landlord',
  TENANT: 'tenant',
  MANAGER: 'manager'
};

// Property types
export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  CONDO: 'condo',
  TOWNHOUSE: 'townhouse',
  OTHER: 'other'
};

// Property statuses
export const PROPERTY_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance'
};

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded'
};

// Maintenance priorities
export const MAINTENANCE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Maintenance statuses
export const MAINTENANCE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

// Lease statuses
export const LEASE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated'
};

// Test card numbers for demo payment gateway
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED: '4000000000000069'
};

// Date formats
export const DATE_FORMAT = 'MM/DD/YYYY';
export const DATETIME_FORMAT = 'MM/DD/YYYY hh:mm A';

// Pagination
export const ITEMS_PER_PAGE = 10;

// File upload limits
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

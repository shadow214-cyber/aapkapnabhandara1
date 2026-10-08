export type PortalStatus = "New" | "Contacted" | "Confirmed" | "Completed" | "Cancelled";

export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  whatsappOptIn?: boolean;
};

export type PortalOrder = CustomerProfile & {
  id: string;
  date: string;
  area: string;
  venue: string;
  guestCount: number;
  dishes: string[];
  estimate: number;
  message: string;
  whatsappOptIn: boolean;
  status: PortalStatus;
  createdAt: string;
};

const profilesKey = "aapb.customer-profiles.v1";
const sessionKey = "aapb.customer-session.v1";
const ordersKey = "aapb.event-requests.v1";
const changedEvent = "aapb-portal-data-change";
const emptyProfiles: CustomerProfile[] = [];
const emptyOrders: PortalOrder[] = [];
let profilesValue: string | null | undefined;
let profilesSnapshot: CustomerProfile[] = emptyProfiles;
let ordersValue: string | null | undefined;
let ordersSnapshot: PortalOrder[] = emptyOrders;
let sessionValue: string | null | undefined;
let sessionSnapshot: CustomerProfile | null = null;

function readArray<T>(key: string): T[] {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export function getCustomerProfiles(): CustomerProfile[] {
  if (typeof window === "undefined") return emptyProfiles;
  const value = window.localStorage.getItem(profilesKey);
  if (value !== profilesValue) {
    profilesValue = value;
    profilesSnapshot = readArray<CustomerProfile>(profilesKey);
  }
  return profilesSnapshot;
}

export function getServerCustomerProfilesSnapshot(): CustomerProfile[] {
  return emptyProfiles;
}

export function getPortalOrders(): PortalOrder[] {
  if (typeof window === "undefined") return emptyOrders;
  const value = window.localStorage.getItem(ordersKey);
  if (value !== ordersValue) {
    ordersValue = value;
    ordersSnapshot = readArray<PortalOrder>(ordersKey).map((order) => ({ ...order, whatsappOptIn: Boolean(order.whatsappOptIn) }));
  }
  return ordersSnapshot;
}

export function getServerPortalOrdersSnapshot(): PortalOrder[] {
  return emptyOrders;
}

export function getCustomerSession(): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(sessionKey);
  if (value !== sessionValue) {
    sessionValue = value;
    try {
      sessionSnapshot = value ? JSON.parse(value) as CustomerProfile : null;
    } catch {
      sessionSnapshot = null;
    }
  }
  return sessionSnapshot;
}

function save(key: string, value: unknown) {
  const serialized = JSON.stringify(value);
  window.localStorage.setItem(key, serialized);
  window.dispatchEvent(new Event(changedEvent));
}

export function saveCustomerProfile(profile: CustomerProfile) {
  const email = profile.email.trim().toLowerCase();
  const normalized = { ...profile, name: profile.name.trim(), email, phone: profile.phone.trim() };
  const profiles = getCustomerProfiles();
  const next = profiles.some((item) => item.email.toLowerCase() === email)
    ? profiles.map((item) => item.email.toLowerCase() === email ? normalized : item)
    : [normalized, ...profiles];
  save(profilesKey, next);
  profilesValue = undefined;
  profilesSnapshot = next;
  const whatsappOptIn = profile.whatsappOptIn;
  if (typeof whatsappOptIn === "boolean") {
    const nextOrders = getPortalOrders().map((order) => order.email.toLowerCase() === email ? { ...order, whatsappOptIn } : order);
    save(ordersKey, nextOrders);
    ordersValue = JSON.stringify(nextOrders);
    ordersSnapshot = nextOrders;
  }
  saveCustomerSession(normalized);
  return normalized;
}

export function findCustomerProfile(email: string): CustomerProfile | undefined {
  return getCustomerProfiles().find((profile) => profile.email.toLowerCase() === email.trim().toLowerCase());
}

export function saveCustomerSession(profile: CustomerProfile) {
  const normalized = { ...profile, email: profile.email.trim().toLowerCase() };
  const serialized = JSON.stringify(normalized);
  window.localStorage.setItem(sessionKey, serialized);
  sessionValue = serialized;
  sessionSnapshot = normalized;
  window.dispatchEvent(new Event(changedEvent));
}

export function clearCustomerSession() {
  window.localStorage.removeItem(sessionKey);
  sessionValue = null;
  sessionSnapshot = null;
  window.dispatchEvent(new Event(changedEvent));
}

export function createPortalOrder(order: Omit<PortalOrder, "id" | "status" | "createdAt">) {
  const created: PortalOrder = {
    ...order,
    id: crypto.randomUUID(),
    status: "New",
    createdAt: new Date().toISOString(),
  };
  const next = [created, ...getPortalOrders()];
  save(ordersKey, next);
  ordersValue = JSON.stringify(next);
  ordersSnapshot = next;
  return created;
}

export function setPortalOrderStatus(id: string, status: PortalStatus) {
  const next = getPortalOrders().map((order) => order.id === id ? { ...order, status } : order);
  save(ordersKey, next);
  ordersValue = JSON.stringify(next);
  ordersSnapshot = next;
}

export function deletePortalOrder(id: string) {
  const next = getPortalOrders().filter((order) => order.id !== id);
  save(ordersKey, next);
  ordersValue = JSON.stringify(next);
  ordersSnapshot = next;
}

export function deleteCustomerData(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const profiles = getCustomerProfiles().filter((profile) => profile.email.toLowerCase() !== normalizedEmail);
  const orders = getPortalOrders().filter((order) => order.email.toLowerCase() !== normalizedEmail);
  save(profilesKey, profiles);
  save(ordersKey, orders);
  profilesValue = JSON.stringify(profiles);
  profilesSnapshot = profiles;
  ordersValue = JSON.stringify(orders);
  ordersSnapshot = orders;
}

export function subscribeToPortalData(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || [profilesKey, ordersKey, sessionKey].includes(event.key)) {
      profilesValue = undefined;
      ordersValue = undefined;
      sessionValue = undefined;
      onChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(changedEvent, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(changedEvent, onChange);
  };
}

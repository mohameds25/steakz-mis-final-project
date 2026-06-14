import { BarChart3, Building2, CalendarClock, CalendarDays, ClipboardList, Edit3, Eye, Filter, LogOut, MapPin, ReceiptText, Search, Shield, ShoppingBag, Trash2, UserPlus, Utensils, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { deleteResource, getResource, login, postResource, putResource, registerCustomer, Role, SessionUser } from "./lib/api";

type BranchStatus = "ACTIVE" | "INACTIVE";
type Branch = {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  status?: BranchStatus;
  manager?: Pick<UserRecord, "id" | "name" | "email" | "role" | "branchId"> | null;
  staffCount?: number;
  totalOrders?: number;
  totalReservations?: number;
  revenue?: number;
};
type OrderItem = { id?: string; name: string; quantity: number; unitPrice?: string; lineTotal?: string };
type Order = { id: string; tableNumber?: number; customerName?: string; status: string; total: string; createdAt?: string; updatedAt?: string; branch?: Branch; items?: OrderItem[] };
type TableBooking = { id: string; customerName?: string; reservationAt: string; guests: number; notes?: string; status: string; branch?: Branch };
type Sale = { id: string; amount: string; paymentMethod: string; status: string; branch?: Branch };
type Shift = { id: string; startsAt: string; endsAt: string; status: string; user: { name: string; role: string }; branch?: Branch };
type UserRecord = { id: string; name: string; email: string; role: Role; branchId?: string | null; branch?: Branch | null };
type BranchDetails = Branch & {
  users: UserRecord[];
  orders: Order[];
  bookings: TableBooking[];
  sales: Sale[];
};
type PublicTab = "home" | "book" | "menu" | "branches" | "login";
type CustomerTab = "welcome" | "booking" | "menu" | "order" | "bookings" | "orders" | "branches";
type StaffTab = "overview" | "reports" | "orders" | "receipts" | "reservations" | "sales" | "shifts" | "branches" | "users";
type Cart = Record<string, number>;

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  HEADQUARTER_MANAGER: "Country Manager",
  BRANCH_MANAGER: "Branch Manager",
  CHEF: "Chef",
  WAITER: "Waiter",
  CASHIER: "Cashier",
  CUSTOMER: "Customer"
};

const publicBranches = [
  { name: "Steakz London", city: "London", address: "Mayfair Dining Quarter", hours: "12:00 - 23:00", specialty: "Dry-aged ribeye and classic steakhouse service" },
  { name: "Steakz Manchester", city: "Manchester", address: "Deansgate", hours: "12:00 - 00:00", specialty: "Prime cuts for business dining and match-day evenings" },
  { name: "Steakz Birmingham", city: "Birmingham", address: "Colmore Row", hours: "12:00 - 23:30", specialty: "Tomahawk steaks and branch-led service operations" },
  { name: "Steakz Liverpool", city: "Liverpool", address: "Albert Dock", hours: "13:00 - 00:00", specialty: "Waterfront dining with fast waiter-to-kitchen order flow" },
  { name: "Steakz Leeds", city: "Leeds", address: "Greek Street", hours: "12:00 - 23:00", specialty: "Premium grill menu with polished branch service" }
];

const menuHighlights = [
  {
    name: "Signature Ribeye",
    detail: "Charcoal seared, herb butter, roasted sides",
    price: 48,
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=82"
  },
  {
    name: "Filet Tenderloin",
    detail: "Pepper crust, truffle jus, potato pave",
    price: 56,
    image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=82"
  },
  {
    name: "Steakz Burger",
    detail: "Prime beef, aged cheddar, house sauce",
    price: 29,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=82"
  },
  {
    name: "Tomahawk Board",
    detail: "Flame-grilled tomahawk, bone marrow butter, triple-cooked chips",
    price: 72,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=82"
  },
  {
    name: "Herb Chicken Grill",
    detail: "Charred herb chicken, lemon jus, seasonal greens",
    price: 34,
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=82"
  },
  {
    name: "Salmon Ember Plate",
    detail: "Grilled salmon, dill cream, roasted asparagus",
    price: 38,
    image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=900&q=82"
  }
];

function defaultBookingDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

const roleProfiles: Record<Exclude<Role, "CUSTOMER">, { title: string; description: string }> = {
  ADMIN: {
    title: "System control center",
    description: "Maintain branches, users, roles, and the technical access layer for the global Steakz platform."
  },
  HEADQUARTER_MANAGER: {
    title: "UK country performance view",
    description: "Compare every UK branch, monitor revenue, review orders, and keep the chain operating from one management layer."
  },
  BRANCH_MANAGER: {
    title: "Branch operations desk",
    description: "Control orders, reservations, staff shifts, and daily sales for your assigned Steakz branch."
  },
  CHEF: {
    title: "Kitchen command board",
    description: "Track active kitchen orders and mark dishes ready without seeing other branch data."
  },
  WAITER: {
    title: "Table service order desk",
    description: "Create and follow guest orders for your own branch without seeing another branch's orders."
  },
  CASHIER: {
    title: "Front-counter checkout",
    description: "Create and follow branch orders, record paid sales, and keep guest transactions moving."
  }
};

export function App() {
  const [publicTab, setPublicTab] = useState<PublicTab>("home");
  const [customerTab, setCustomerTab] = useState<CustomerTab>("welcome");
  const [staffTab, setStaffTab] = useState<StaffTab>("overview");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orderBranchId, setOrderBranchId] = useState("");
  const [selectedMenuItem, setSelectedMenuItem] = useState(menuHighlights[0].name);
  const [selectedPublicBranch, setSelectedPublicBranch] = useState(publicBranches[0]);
  const [cart, setCart] = useState<Cart>({ [menuHighlights[0].name]: 1 });
  const [reservationDate, setReservationDate] = useState(defaultBookingDate);
  const [reservationTime, setReservationTime] = useState("19:00");
  const [reservationGuests, setReservationGuests] = useState(2);
  const [branchDraft, setBranchDraft] = useState({ name: "", city: "", address: "", phone: "", status: "ACTIVE" as BranchStatus });
  const [editingBranchId, setEditingBranchId] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [branchStatusFilter, setBranchStatusFilter] = useState<"ALL" | BranchStatus>("ALL");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedBranchDetails, setSelectedBranchDetails] = useState<BranchDetails | null>(null);
  const [managerAssignment, setManagerAssignment] = useState("");
  const [staffDraft, setStaffDraft] = useState({ name: "", email: "", password: "123456", role: "WAITER" as Role, branchId: "" });
  const [editingUserId, setEditingUserId] = useState("");
  const [staffOrderDraft, setStaffOrderDraft] = useState({ customerName: "", branchId: "", menuItem: menuHighlights[0].name, quantity: 1, status: "NEW" });
  const [token, setToken] = useState(localStorage.getItem("steakzToken") || "");
  const [user, setUser] = useState<SessionUser | null>(() => {
    const saved = localStorage.getItem("steakzUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [data, setData] = useState<{ branches: Branch[]; orders: Order[]; bookings: TableBooking[]; sales: Sale[]; shifts: Shift[]; users: UserRecord[] }>({
    branches: [],
    orders: [],
    bookings: [],
    sales: [],
    shifts: [],
    users: []
  });
  const [error, setError] = useState("");

  const cartItems = menuHighlights
    .map((item) => ({ ...item, quantity: cart[item.name] || 0 }))
    .filter((item) => item.quantity > 0);
  const customerOrderTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const selectedCustomerBranch = data.branches.find((branch) => branch.id === orderBranchId);
  const customerCanOrder = user?.role === "CUSTOMER" ? data.bookings.length > 0 : true;

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const session = await login(email, password);
      setToken(session.token);
      setUser(session.user);
      if (session.user.role === "CUSTOMER") {
        setCustomerTab("welcome");
      }
      localStorage.setItem("steakzPendingBranch", selectedPublicBranch.name);
      localStorage.setItem("steakzToken", session.token);
      localStorage.setItem("steakzUser", JSON.stringify(session.user));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed. Check your email and password.");
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const session = await registerCustomer(name, email, password);
      setToken(session.token);
      setUser(session.user);
      setCustomerTab("welcome");
      localStorage.setItem("steakzPendingBranch", selectedPublicBranch.name);
      localStorage.setItem("steakzToken", session.token);
      localStorage.setItem("steakzUser", JSON.stringify(session.user));
    } catch {
      setError("Could not create that customer account. Try a new email and a 6+ character password.");
    }
  }

  async function handleCustomerOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !user) return;
    if (!customerCanOrder) {
      setError("Please book a table first, then place your order.");
      return;
    }
    const branchId = orderBranchId || data.branches[0]?.id;
    if (!branchId) {
      setError("No branches are available yet.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Please add at least one dish before placing the order.");
      return;
    }
    try {
      const orderItems = cartItems.map((item) => `${item.quantity}x ${item.name}`).join(", ");
      await postResource<Order>("/api/orders", token, {
        branchId,
        customerName: `${user.name} - ${orderItems}`,
        total: customerOrderTotal,
        items: cartItems.map((item) => ({ name: item.name, quantity: item.quantity, unitPrice: item.price }))
      });
      const orders = await getResource<Order[]>("/api/orders", token);
      setData((current) => ({ ...current, orders }));
      setCart({});
      const branchName = data.branches.find((branch) => branch.id === branchId)?.name ?? "selected branch";
      setError(`Order placed for ${branchName}. Only this branch team and the Country Manager/Admin can see it.`);
    } catch {
      setError("Could not place the order. Check the backend and branch selection.");
    }
  }

  async function handleStaffOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !user) return;
    const menuItem = menuHighlights.find((item) => item.name === staffOrderDraft.menuItem) ?? menuHighlights[0];
    const branchId = user.branchId || staffOrderDraft.branchId || data.branches[0]?.id;
    if (!branchId) {
      setError("Choose a branch before creating the order.");
      return;
    }
    try {
      const total = menuItem.price * staffOrderDraft.quantity;
      const order = await postResource<Order>("/api/orders", token, {
        branchId,
        customerName: `${staffOrderDraft.customerName || "Walk-in Guest"} - ${staffOrderDraft.quantity}x ${menuItem.name}`,
        total,
        items: [{ name: menuItem.name, quantity: staffOrderDraft.quantity, unitPrice: menuItem.price }]
      });
      if (staffOrderDraft.status !== "NEW") {
        await putResource<Order>(`/api/orders/${order.id}/status`, token, { status: staffOrderDraft.status });
      }
      const [orders, sales] = await Promise.all([
        getResource<Order[]>("/api/orders", token),
        canSeeSales(user.role) ? getResource<Sale[]>("/api/sales", token) : Promise.resolve(data.sales)
      ]);
      setData((current) => ({ ...current, orders, sales }));
      setStaffOrderDraft((current) => ({ ...current, customerName: "", quantity: 1, status: "NEW" }));
      setError("Walk-in order saved.");
    } catch {
      setError("Could not create the order. Check branch access and order details.");
    }
  }

  async function handleOrderStatus(orderId: string, status: string) {
    if (!token) return;
    try {
      await putResource<Order>(`/api/orders/${orderId}/status`, token, { status });
      const [orders, sales] = await Promise.all([
        getResource<Order[]>("/api/orders", token),
        canSeeSales(user?.role) ? getResource<Sale[]>("/api/sales", token) : Promise.resolve(data.sales)
      ]);
      setData((current) => ({ ...current, orders, sales }));
      setError(`Order marked as ${status.toLowerCase()}.`);
    } catch {
      setError("Could not update the order status.");
    }
  }

  async function handleEditOrder(order: Order) {
    if (!token) return;
    const customerName = window.prompt("Customer name / order note", order.customerName ?? "");
    if (customerName === null) return;
    const totalInput = window.prompt("Total price", String(order.total));
    if (totalInput === null) return;
    try {
      await putResource<Order>(`/api/orders/${order.id}`, token, {
        customerName,
        total: Number(totalInput)
      });
      const [orders, sales] = await Promise.all([
        getResource<Order[]>("/api/orders", token),
        canSeeSales(user?.role) ? getResource<Sale[]>("/api/sales", token) : Promise.resolve(data.sales)
      ]);
      setData((current) => ({ ...current, orders, sales }));
      setError("Order updated.");
    } catch {
      setError("Could not edit this order.");
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (!token) return;
    try {
      await deleteResource(`/api/orders/${orderId}`, token);
      const [orders, sales] = await Promise.all([
        getResource<Order[]>("/api/orders", token),
        canSeeSales(user?.role) ? getResource<Sale[]>("/api/sales", token) : Promise.resolve(data.sales)
      ]);
      setData((current) => ({ ...current, orders, sales }));
      setError("Order deleted.");
    } catch {
      setError("Could not delete this order.");
    }
  }

  async function handleBookingStatus(bookingId: string, status: string) {
    if (!token) return;
    try {
      await putResource<TableBooking>(`/api/bookings/${bookingId}/status`, token, { status });
      const bookings = await getResource<TableBooking[]>("/api/bookings", token);
      setData((current) => ({ ...current, bookings }));
      setError(`Reservation marked as ${status.toLowerCase()}.`);
    } catch {
      setError("Could not update the reservation status.");
    }
  }

  async function handleEditBooking(booking: TableBooking) {
    if (!token) return;
    const guests = window.prompt("Number of persons", String(booking.guests));
    if (guests === null) return;
    try {
      await putResource<TableBooking>(`/api/bookings/${booking.id}`, token, { guests: Number(guests) });
      const bookings = await getResource<TableBooking[]>("/api/bookings", token);
      setData((current) => ({ ...current, bookings }));
      setError("Reservation updated.");
    } catch {
      setError("Could not edit this reservation.");
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    if (!token) return;
    try {
      await deleteResource(`/api/bookings/${bookingId}`, token);
      const bookings = await getResource<TableBooking[]>("/api/bookings", token);
      setData((current) => ({ ...current, bookings }));
      setError("Reservation deleted.");
    } catch {
      setError("Could not delete this reservation.");
    }
  }

  async function handleCreateBranch(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await postResource<Branch>("/api/branches", token, branchDraft);
      const [branches, users] = await Promise.all([
        getResource<Branch[]>("/api/branches", token),
        canSeeUsers(user?.role) ? getResource<UserRecord[]>("/api/users", token) : Promise.resolve(data.users)
      ]);
      setData((current) => ({ ...current, branches, users }));
      setBranchDraft({ name: "", city: "", address: "", phone: "", status: "ACTIVE" });
      setError("New branch added with default staff accounts.");
    } catch {
      setError("Could not add the branch. Fill all branch details.");
    }
  }

  async function handleUpdateBranch(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !editingBranchId) return;
    const savedBranchId = editingBranchId;
    try {
      await putResource<Branch>(`/api/branches/${savedBranchId}`, token, branchDraft);
      const [branches, orders, bookings, sales, users] = await Promise.all([
        getResource<Branch[]>("/api/branches", token),
        getResource<Order[]>("/api/orders", token),
        canSeeBookings(user?.role) ? getResource<TableBooking[]>("/api/bookings", token) : Promise.resolve(data.bookings),
        canSeeSales(user?.role) ? getResource<Sale[]>("/api/sales", token) : Promise.resolve(data.sales),
        canSeeUsers(user?.role) ? getResource<UserRecord[]>("/api/users", token) : Promise.resolve(data.users)
      ]);
      setData((current) => ({ ...current, branches, orders, bookings, sales, users }));
      setEditingBranchId("");
      setBranchDraft({ name: "", city: "", address: "", phone: "", status: "ACTIVE" });
      await loadBranchDetails(savedBranchId);
      setError(`${branchDraft.name} updated successfully.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update the branch. Check the details and your role access.");
    }
  }

  async function startEditBranch(branch: Branch) {
    setError(`Editing ${branch.name}. Update the form below and press Save Branch.`);
    setEditingBranchId(branch.id);
    setBranchDraft({
      name: branch.name,
      city: branch.city,
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      status: branch.status ?? "ACTIVE"
    });
    await loadBranchDetails(branch.id);
    setTimeout(() => document.getElementById("branch-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  function cancelEditBranch() {
    setEditingBranchId("");
    setBranchDraft({ name: "", city: "", address: "", phone: "", status: "ACTIVE" });
  }

  async function handleDeleteBranch(branchId: string) {
    if (!token) return;
    const branch = data.branches.find((item) => item.id === branchId);
    const confirmed = window.confirm(`Delete ${branch?.name ?? "this branch"}? This will remove linked branch records.`);
    if (!confirmed) return;
    try {
      await deleteResource(`/api/branches/${branchId}`, token);
      const [branches, users, orders, bookings, sales, shifts] = await Promise.all([
        getResource<Branch[]>("/api/branches", token),
        canSeeUsers(user?.role) ? getResource<UserRecord[]>("/api/users", token) : Promise.resolve(data.users),
        getResource<Order[]>("/api/orders", token),
        canSeeBookings(user?.role) ? getResource<TableBooking[]>("/api/bookings", token) : Promise.resolve(data.bookings),
        canSeeSales(user?.role) ? getResource<Sale[]>("/api/sales", token) : Promise.resolve(data.sales),
        canSeeShifts(user?.role) ? getResource<Shift[]>("/api/shifts", token) : Promise.resolve(data.shifts)
      ]);
      setData((current) => ({ ...current, branches, users, orders, bookings, sales, shifts }));
      if (selectedBranchId === branchId) {
        setSelectedBranchId("");
        setSelectedBranchDetails(null);
      }
      setError(`${branch?.name ?? "Branch"} deleted with its staff accounts.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not delete this branch. It may still have linked records.");
    }
  }

  async function loadBranchDetails(branchId: string) {
    if (!token) return;
    try {
      const details = await getResource<BranchDetails>(`/api/branches/${branchId}/details`, token);
      setSelectedBranchId(branchId);
      setSelectedBranchDetails(details);
      setManagerAssignment(details.manager?.id ?? "");
    } catch {
      setError("Could not open branch details for this role.");
    }
  }

  async function handleAssignManager(branchId: string) {
    if (!token || !managerAssignment) return;
    try {
      await putResource<UserRecord>(`/api/branches/${branchId}/manager`, token, { managerId: managerAssignment });
      const [branches, users] = await Promise.all([
        getResource<Branch[]>("/api/branches", token),
        canSeeUsers(user?.role) ? getResource<UserRecord[]>("/api/users", token) : Promise.resolve(data.users)
      ]);
      setData((current) => ({ ...current, branches, users }));
      await loadBranchDetails(branchId);
      setError("Branch manager assigned.");
    } catch {
      setError("Could not assign this manager.");
    }
  }

  function resetStaffDraft(keepBranchId = false) {
    setEditingUserId("");
    setStaffDraft({
      name: "",
      email: "",
      password: "123456",
      role: user?.role === "BRANCH_MANAGER" ? "WAITER" : "WAITER",
      branchId: keepBranchId ? staffDraft.branchId : ""
    });
  }

  function startEditUser(account: UserRecord) {
    setEditingUserId(account.id);
    setStaffDraft({
      name: account.name,
      email: account.email,
      password: "",
      role: account.role,
      branchId: account.branchId ?? account.branch?.id ?? ""
    });
    window.location.hash = "users";
  }

  async function refreshUsersAndBranches() {
    if (!token) return;
    const [users, branches] = await Promise.all([
      canSeeUsers(user?.role) ? getResource<UserRecord[]>("/api/users", token) : Promise.resolve(data.users),
      getResource<Branch[]>("/api/branches", token)
    ]);
    setData((current) => ({ ...current, users, branches }));
    if (selectedBranchId) {
      await loadBranchDetails(selectedBranchId);
    }
  }

  async function handleSaveStaff(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !user) return;
    const branchId = user.role === "BRANCH_MANAGER" ? user.branchId : staffDraft.branchId;
    try {
      const payload = {
        name: staffDraft.name,
        email: staffDraft.email,
        role: staffDraft.role,
        branchId: branchId || null,
        ...(staffDraft.password ? { password: staffDraft.password } : {})
      };
      if (editingUserId) {
        await putResource<UserRecord>(`/api/users/${editingUserId}`, token, payload);
      } else {
        await postResource<UserRecord>("/api/users", token, { ...payload, password: staffDraft.password || "123456" });
      }
      await refreshUsersAndBranches();
      resetStaffDraft(user.role === "HEADQUARTER_MANAGER");
      setError(editingUserId ? "User account updated." : "User account created.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save user account. Check email, role, and branch.");
    }
  }

  async function handleDeleteUser(userId: string, name: string) {
    if (!token || !window.confirm(`Delete ${name}? This removes their login access.`)) return;
    try {
      await deleteResource(`/api/users/${userId}`, token);
      await refreshUsersAndBranches();
      if (editingUserId === userId) {
        resetStaffDraft();
      }
      setError("User account deleted.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not delete this user.");
    }
  }

  function openCustomerRegistration() {
    localStorage.setItem("steakzPendingBranch", selectedPublicBranch.name);
    setMode("register");
    setPublicTab("login");
  }

  function updateCartItem(itemName: string, nextQuantity: number) {
    setSelectedMenuItem(itemName);
    setCart((current) => {
      const quantity = Math.max(0, Math.min(12, nextQuantity));
      const next = { ...current };
      if (quantity === 0) {
        delete next[itemName];
      } else {
        next[itemName] = quantity;
      }
      return next;
    });
  }

  function handleCustomerReservation(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !user) return;
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const bookingDate = String(formData.get("reservationDate") || reservationDate);
    const bookingTime = String(formData.get("reservationTime") || reservationTime || "19:00");
    const guests = Number(formData.get("reservationGuests") || reservationGuests);
    const branchId = orderBranchId || data.branches[0]?.id;
    if (!branchId) {
      setError("Please choose a branch before booking a table.");
      return;
    }
    if (!bookingDate) {
      setError("Please choose a date for the table booking.");
      return;
    }
    const reservationAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();
    postResource<TableBooking>("/api/bookings", token, {
      branchId,
      reservationAt,
      guests
    })
      .then(() => getResource<TableBooking[]>("/api/bookings", token))
      .then((bookings) => {
        setData((current) => ({ ...current, bookings }));
        const branchName = data.branches.find((branch) => branch.id === branchId)?.name ?? "selected branch";
        setError(`Table request saved for ${branchName}. You can now add dishes to your order.`);
      })
      .catch(() => setError("Could not save the table booking. Check the backend and branch selection."));
  }

  useEffect(() => {
    if (!token) return;
    const requests: [
      Promise<Branch[]>,
      Promise<Order[]>,
      Promise<Sale[]>,
      Promise<Shift[]>,
      Promise<UserRecord[]>,
      Promise<TableBooking[]>
    ] =
      user?.role === "CUSTOMER"
        ? [
            getResource<Branch[]>("/api/branches", token),
            getResource<Order[]>("/api/orders", token),
            Promise.resolve([] as Sale[]),
            Promise.resolve([] as Shift[]),
            Promise.resolve([] as UserRecord[]),
            getResource<TableBooking[]>("/api/bookings", token)
          ]
        : [
            getResource<Branch[]>("/api/branches", token),
            getResource<Order[]>("/api/orders", token),
            canSeeSales(user?.role) ? getResource<Sale[]>("/api/sales", token) : Promise.resolve([] as Sale[]),
            canSeeShifts(user?.role) ? getResource<Shift[]>("/api/shifts", token) : Promise.resolve([] as Shift[]),
            canSeeUsers(user?.role) ? getResource<UserRecord[]>("/api/users", token) : Promise.resolve([] as UserRecord[]),
            canSeeBookings(user?.role)
              ? getResource<TableBooking[]>("/api/bookings", token)
              : Promise.resolve([] as TableBooking[])
          ];
    Promise.all(requests)
      .then(([branches, orders, sales, shifts, users, bookings]) => setData({ branches, orders, sales, shifts, users, bookings }))
      .catch(() => setError("Could not load dashboard data. Check that the backend is running on port 4000."));
  }, [token, user?.role]);

  useEffect(() => {
    if (user?.role !== "CUSTOMER" || data.branches.length === 0 || orderBranchId) return;
    const pendingBranchName = localStorage.getItem("steakzPendingBranch") || selectedPublicBranch.name;
    const matchedBranch = data.branches.find((branch) => branch.name === pendingBranchName) || data.branches[0];
    setOrderBranchId(matchedBranch.id);
  }, [data.branches, orderBranchId, selectedPublicBranch.name, user?.role]);

  useEffect(() => {
    if (!user || user.role === "CUSTOMER" || staffTab !== "branches" || selectedBranchId || data.branches.length === 0) return;
    const defaultBranch = user.branchId ? data.branches.find((branch) => branch.id === user.branchId) : data.branches[0];
    if (defaultBranch) {
      loadBranchDetails(defaultBranch.id);
    }
  }, [data.branches, selectedBranchId, staffTab, user?.branchId, user?.role]);

  const totals = useMemo(() => {
    const revenue = data.sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
    const customers = data.users.filter((account) => account.role === "CUSTOMER").length;
    const staff = data.users.filter((account) => account.role !== "CUSTOMER").length;
    const branchRevenue = data.branches.map((branch) => ({
      branch: branch.name,
      orders: data.orders.filter((order) => order.branch?.id === branch.id).length,
      revenue: data.sales
        .filter((sale) => sale.branch?.id === branch.id)
        .reduce((sum, sale) => sum + Number(sale.amount), 0)
    }));
    const topItems = menuHighlights
      .map((item) => ({
        item: item.name,
        orders: data.orders.reduce((sum, order) => {
          const savedQuantity = order.items?.find((orderItem) => orderItem.name === item.name)?.quantity;
          return sum + (savedQuantity ?? (order.customerName?.includes(item.name) ? 1 : 0));
        }, 0)
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
    return { revenue, customers, staff, branchRevenue, topItems };
  }, [data]);

  const staffRole = user?.role && user.role !== "CUSTOMER" ? user.role : undefined;
  const profile = staffRole ? roleProfiles[staffRole] : undefined;
  const canManageBranchAdmin = user?.role === "ADMIN" || user?.role === "HEADQUARTER_MANAGER" || user?.role === "BRANCH_MANAGER";
  const canControlAllBranches = user?.role === "ADMIN" || user?.role === "HEADQUARTER_MANAGER";
  const branchManagers = data.users.filter((account) => account.role === "BRANCH_MANAGER");
  const filteredBranches = data.branches.filter((branch) => {
    const haystack = `${branch.name} ${branch.city} ${branch.manager?.name ?? ""}`.toLowerCase();
    const matchesSearch = haystack.includes(branchSearch.toLowerCase());
    const matchesStatus = branchStatusFilter === "ALL" || (branch.status ?? "ACTIVE") === branchStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const customerTabs: Array<{ id: CustomerTab; label: string; icon: React.ReactNode }> = [
    { id: "welcome", label: "Welcome", icon: <Shield size={18} /> },
    { id: "booking", label: "Book Table", icon: <CalendarDays size={18} /> },
    { id: "menu", label: "Menu", icon: <Utensils size={18} /> },
    { id: "order", label: "Order", icon: <ShoppingBag size={18} /> },
    { id: "bookings", label: "My Bookings", icon: <CalendarClock size={18} /> },
    { id: "orders", label: "My Orders", icon: <ClipboardList size={18} /> },
    { id: "branches", label: "Branches", icon: <Building2 size={18} /> }
  ];
  const staffTabs: Array<{ id: StaffTab; label: string; icon: React.ReactNode; visible?: boolean }> = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={18} /> },
    { id: "reports", label: "Reports", icon: <BarChart3 size={18} />, visible: user?.role === "ADMIN" || user?.role === "HEADQUARTER_MANAGER" },
    { id: "orders", label: "Orders", icon: <ClipboardList size={18} /> },
    { id: "receipts", label: "Receipts", icon: <ReceiptText size={18} />, visible: user?.role === "WAITER" },
    { id: "reservations", label: "Reservations", icon: <CalendarDays size={18} />, visible: canSeeBookings(user?.role) },
    { id: "sales", label: "Sales", icon: <BarChart3 size={18} />, visible: canSeeSales(user?.role) },
    { id: "shifts", label: "Shifts", icon: <CalendarClock size={18} />, visible: canSeeShifts(user?.role) },
    { id: "branches", label: "Branches", icon: <Building2 size={18} />, visible: canManageBranchAdmin },
    { id: "users", label: "Users", icon: <Users size={18} />, visible: canSeeUsers(user?.role) }
  ];

  if (!user) {
    return (
      <main className="public-site">
        <header className="public-header">
          <button className="public-brand" type="button" onClick={() => setPublicTab("home")} aria-label="Steakz home">
            <span>S</span>
            <strong>Steakz</strong>
            <small>Global Luxury Dining</small>
          </button>
          <nav className="public-nav">
            <button className={publicTab === "home" ? "active" : ""} type="button" onClick={() => setPublicTab("home")}>Home</button>
            <button className={publicTab === "book" ? "active" : ""} type="button" onClick={() => setPublicTab("book")}>Book a Table</button>
            <button className={publicTab === "menu" ? "active" : ""} type="button" onClick={() => setPublicTab("menu")}>Menu</button>
            <button className={publicTab === "branches" ? "active" : ""} type="button" onClick={() => setPublicTab("branches")}>Branches</button>
            <button className={publicTab === "login" ? "active" : ""} type="button" onClick={() => setPublicTab("login")}>Login</button>
          </nav>
        </header>

        {publicTab === "home" && (
          <>
            <section className="hero-section">
              <div className="hero-copy">
                <p className="gold-eyebrow">Worldwide restaurant chain MIS</p>
                <h1>Steakz service, from guest table to headquarters control.</h1>
                <p>A polished guest experience connected to the same global operating system used for orders, kitchen work, sales, shifts, branches, and role security.</p>
                <div className="hero-actions">
                  <button className="gold-button" type="button" onClick={() => setPublicTab("book")}>Reserve a table</button>
                  <button className="outline-button" type="button" onClick={() => setPublicTab("login")}>Open secure portal</button>
                </div>
              </div>
              <div className="hero-visual">
                <div className="service-board">
                  <span className="board-kicker">Live Chain Snapshot</span>
                  <strong>5 UK branches</strong>
                  <p>Guest reservations, kitchen orders, stock alerts, and management reporting stay in one country-wide flow.</p>
                  <div className="board-pills">
                    <span>Guest</span>
                    <span>Kitchen</span>
                    <span>Country</span>
                  </div>
                </div>
              </div>
              <div className="hero-stats">
                <span><strong>01</strong>Guest booking</span>
                <span><strong>02</strong>Branch operations</span>
                <span><strong>03</strong>Country decisions</span>
              </div>
            </section>

            <section className="home-info">
              <div className="home-story">
                <p className="gold-eyebrow">Our Story</p>
                <h2>Built for slow dinners, sharp service, and global control.</h2>
                <p>Steakz is a worldwide luxury steakhouse concept where guests experience polished dining while every branch runs through one connected information system. The same platform supports reservations, customer orders, kitchen preparation, sales, shifts, and headquarters reporting.</p>
              </div>
              <div className="hours-card">
                <p className="gold-eyebrow">Opening Hours</p>
                <dl>
                  <div><dt>Monday - Thursday</dt><dd>12:00 - 23:00</dd></div>
                  <div><dt>Friday - Saturday</dt><dd>12:00 - 01:00</dd></div>
                  <div><dt>Sunday</dt><dd>13:00 - 22:00</dd></div>
                </dl>
              </div>
              <div className="info-tile">
                <strong>Prime Cuts</strong>
                <span>Ribeye, filet, sirloin, and signature burgers prepared with branch-level stock tracking.</span>
              </div>
              <div className="info-tile">
                <strong>Worldwide Branches</strong>
                <span>London, Manchester, Birmingham, Liverpool, and Leeds operate under one country manager view.</span>
              </div>
              <div className="info-tile">
                <strong>Smart Operations</strong>
                <span>Waiters place branch orders, chefs see kitchen work, managers monitor branches, and admins control access.</span>
              </div>
            </section>
          </>
        )}

        {publicTab === "book" && (
          <section className="public-section split-section standalone-tab">
            <div className="section-narrative">
              <p className="gold-eyebrow">Reservations</p>
              <h2>A guest flow that feeds the operation.</h2>
              <p>Customers can start with a reservation request or register for the portal. Staff continue the journey through order, kitchen, sale, and reporting workflows.</p>
            </div>
            <form className="public-form">
              <label>
                Guest name
                <input />
              </label>
              <label>
                Branch
                <select
                  value={selectedPublicBranch.name}
                  onChange={(event) => {
                    const branch = publicBranches.find((item) => item.name === event.target.value);
                    if (branch) setSelectedPublicBranch(branch);
                  }}
                >
                  {publicBranches.map((branch) => (
                    <option key={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </label>
              <div className="booking-branch-preview">
                <strong>{selectedPublicBranch.name}</strong>
                <span>{selectedPublicBranch.address} · Open {selectedPublicBranch.hours}</span>
              </div>
              <label>
                Date
                <input type="date" />
              </label>
              <label>
                Time
                <input type="time" defaultValue="19:00" />
              </label>
              <label>
                For how many persons
                <input type="number" min="1" max="12" defaultValue="2" />
              </label>
              <button type="button" onClick={openCustomerRegistration}><CalendarDays size={18} /> Request table</button>
            </form>
          </section>
        )}

        {publicTab === "menu" && (
          <section className="public-section standalone-tab">
            <div className="section-heading">
              <p className="gold-eyebrow">Menu</p>
              <h2>Signature cuts for the front of house.</h2>
            </div>
            <div className="menu-grid">
              {menuHighlights.map((item) => (
                <article className="public-card" key={item.name}>
                  <img className="menu-photo" src={item.image} alt={item.name} />
                  <Utensils size={20} />
                  <h3>{item.name}</h3>
                  <p>{item.detail}</p>
                  <strong className="menu-price">£{item.price}</strong>
                </article>
              ))}
            </div>
          </section>
        )}

        {publicTab === "branches" && (
          <section className="public-section standalone-tab">
            <div className="section-heading">
              <p className="gold-eyebrow">Branches</p>
              <h2>UK branches connected to one country management layer.</h2>
            </div>
            <div className="branch-layout">
              <div className="branch-grid">
                {publicBranches.map((branch) => (
                  <button
                    className={`branch-card ${selectedPublicBranch.name === branch.name ? "selected" : ""}`}
                    key={branch.name}
                    type="button"
                    onClick={() => setSelectedPublicBranch(branch)}
                  >
                    <MapPin size={18} />
                    <strong>{branch.name}</strong>
                    <span>{branch.city}</span>
                  </button>
                ))}
              </div>
              <article className="branch-detail">
                <p className="gold-eyebrow">Selected Branch</p>
                <h3>{selectedPublicBranch.name}</h3>
                <dl>
                  <div><dt>City</dt><dd>{selectedPublicBranch.city}</dd></div>
                  <div><dt>Location</dt><dd>{selectedPublicBranch.address}</dd></div>
                  <div><dt>Open</dt><dd>{selectedPublicBranch.hours}</dd></div>
                  <div><dt>Specialty</dt><dd>{selectedPublicBranch.specialty}</dd></div>
                </dl>
                <div className="branch-actions">
                  <button className="gold-button" type="button" onClick={() => setPublicTab("book")}>Book here</button>
                  <button className="outline-button" type="button" onClick={() => setPublicTab("login")}>Customer portal</button>
                </div>
              </article>
            </div>
          </section>
        )}

        {publicTab === "login" && (
          <section className="public-section login-section standalone-tab">
            <section className="login-panel">
              <div>
                <p className="eyebrow">Steakz Restaurant Chain</p>
                <h2>{mode === "login" ? "Portal Login" : "Create Customer Account"}</h2>
              </div>
              <div className="auth-tabs">
                <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button>
                <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
              </div>
              <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="login-form">
                {mode === "register" && (
                  <label>
                    Full name
                    <input value={name} onChange={(event) => setName(event.target.value)} />
                  </label>
                )}
                <label>
                  Email
                  <input
                    autoComplete="off"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value.trim());
                      setPassword("");
                      setError("");
                    }}
                  />
                </label>
                <label>
                  Password
                  <input
                    autoComplete="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                  />
                </label>
                <button type="submit">{mode === "login" ? "Sign in" : "Create account"}</button>
                {error && <p className="error">{error}</p>}
              </form>
            </section>
          </section>
        )}
      </main>
    );
  }

  if (user.role === "CUSTOMER") {
    return (
      <main className="app-shell customer-shell">
        <aside className="sidebar">
          <div className="brand"><Shield size={22} /> Steakz</div>
          <nav>
            {customerTabs.map((tab) => (
              <button
                className={customerTab === tab.id ? "active" : ""}
                key={tab.id}
                type="button"
                onClick={() => setCustomerTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="workspace">
          <header className="topbar">
            <div>
              <p className="eyebrow">{roleLabels[user.role]}</p>
              <h1>{user.name}</h1>
            </div>
            <button className="icon-button" type="button" title="Sign out" onClick={() => {
              localStorage.clear();
              setUser(null);
              setToken("");
            }}>
              <LogOut size={18} />
            </button>
          </header>

          {error && <p className="notice">{error}</p>}

          <section className="metrics customer-metrics">
            <Metric label="UK Branches" value={data.branches.length} icon={<Building2 />} />
            <Metric label="My Orders" value={data.orders.length} icon={<ClipboardList />} />
            <Metric label="My Bookings" value={data.bookings.length} icon={<CalendarClock />} />
            <Metric label="Cart Total" value={`£${customerOrderTotal.toFixed(2)}`} icon={<Utensils />} />
          </section>

          <section className="customer-flow">
            <article className={data.bookings.length > 0 ? "done" : "active"}>
              <span>1</span>
              <strong>Book a table</strong>
              <small>Choose branch, date, time, and party size.</small>
            </article>
            <article className={data.bookings.length > 0 ? "active" : ""}>
              <span>2</span>
              <strong>Select dishes</strong>
              <small>Add more than one item to the cart.</small>
            </article>
            <article className={data.orders.length > 0 ? "done" : ""}>
              <span>3</span>
              <strong>Place order</strong>
              <small>The order is visible only to that branch.</small>
            </article>
          </section>

          <section className="content-grid customer-grid">
            {customerTab === "welcome" && <Panel id="welcome" title="Welcome" icon={<Shield />}>
              <section className="customer-welcome">
                <div>
                  <p className="eyebrow">Steakz guest portal</p>
                  <h2>Welcome back, {user.name}</h2>
                  <p>Your table booking, branch choice, menu cart, and order history are ready in one place.</p>
                </div>
                <div className="welcome-summary">
                  <span>
                    <strong>{selectedCustomerBranch?.name ?? data.branches[0]?.name ?? "Choose a branch"}</strong>
                    Preferred branch
                  </span>
                  <span>
                    <strong>{data.bookings.length}</strong>
                    Active booking requests
                  </span>
                  <span>
                    <strong>£{customerOrderTotal.toFixed(2)}</strong>
                    Current cart total
                  </span>
                </div>
                <div className="welcome-actions">
                  <button type="button" onClick={() => setCustomerTab("booking")}>Book a table</button>
                  <button type="button" onClick={() => setCustomerTab("menu")}>View menu</button>
                  <button type="button" onClick={() => setCustomerTab("orders")}>My orders</button>
                </div>
              </section>
            </Panel>}

            {customerTab === "menu" && <Panel id="menu" title="Step 2 - Select Dishes" icon={<Utensils />}>
              <div className="customer-menu">
                {menuHighlights.map((item) => (
                  <article
                    className={selectedMenuItem === item.name ? "selected" : ""}
                    key={item.name}
                    onClick={() => setSelectedMenuItem(item.name)}
                  >
                    <img src={item.image} alt={item.name} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <b>£{item.price}</b>
                    <div className="cart-stepper" onClick={(event) => event.stopPropagation()}>
                      <button type="button" aria-label={`Remove ${item.name}`} onClick={() => updateCartItem(item.name, (cart[item.name] || 0) - 1)}>-</button>
                      <output>{cart[item.name] || 0}</output>
                      <button type="button" aria-label={`Add ${item.name}`} onClick={() => updateCartItem(item.name, (cart[item.name] || 0) + 1)}>+</button>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>}

            {customerTab === "booking" && <Panel id="booking" title="Step 1 - Book a Table" icon={<CalendarDays />}>
              <form className="order-form" onSubmit={handleCustomerReservation}>
                <label>
                  Branch
                  <select value={orderBranchId} onChange={(event) => setOrderBranchId(event.target.value)}>
                    {data.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input name="reservationDate" type="date" value={reservationDate} onChange={(event) => setReservationDate(event.target.value)} />
                </label>
                <label>
                  Time
                  <input name="reservationTime" type="time" value={reservationTime} onChange={(event) => setReservationTime(event.target.value)} />
                </label>
                <label>
                  For how many persons
                  <input name="reservationGuests" type="number" min="1" max="12" value={reservationGuests} onChange={(event) => setReservationGuests(Number(event.target.value))} />
                </label>
                <button type="submit">Save table request</button>
              </form>
            </Panel>}

            {customerTab === "order" && <Panel id="order" title="Step 3 - Place Order" icon={<ShoppingBag />}>
              <form className="order-form" onSubmit={handleCustomerOrder}>
                {!customerCanOrder && <p className="stage-note">Book a table first to unlock order placement.</p>}
                <label>
                  Branch
                  <select value={orderBranchId} onChange={(event) => setOrderBranchId(event.target.value)}>
                    {data.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
                    ))}
                  </select>
                </label>
                <div className="cart-summary">
                  <strong>{selectedCustomerBranch?.name ?? "Choose a branch"}</strong>
                  {cartItems.length === 0 ? (
                    <span>No dishes selected</span>
                  ) : (
                    cartItems.map((item) => (
                      <span key={item.name}>
                        {item.quantity}x {item.name}
                        <b>£{(item.price * item.quantity).toFixed(2)}</b>
                      </span>
                    ))
                  )}
                </div>
                <div className="order-summary">
                  <span>Total</span>
                  <strong>£{customerOrderTotal.toFixed(2)}</strong>
                </div>
                <button type="submit" disabled={!data.branches.length || cartItems.length === 0 || !customerCanOrder}>Place order</button>
              </form>
            </Panel>}
            {customerTab === "bookings" && <Panel id="bookings" title="My Bookings" icon={<CalendarClock />}>
              <Table
                rows={data.bookings.map((booking) => ({
                  branch: booking.branch?.name,
                  date: formatBookingDate(booking.reservationAt),
                  guests: booking.guests,
                  status: booking.status
                }))}
                columns={["branch", "date", "guests", "status"]}
              />
            </Panel>}
            {customerTab === "orders" && <Panel id="orders" title="My Orders" icon={<ClipboardList />}>
              <Table rows={data.orders.map((order) => ({ branch: order.branch?.name, items: formatOrderItems(order), status: order.status, total: order.total }))} columns={["branch", "items", "status", "total"]} />
            </Panel>}
            {customerTab === "branches" && <Panel id="branches" title="Branches" icon={<Building2 />}>
              <Table rows={data.branches} columns={["name", "city"]} />
            </Panel>}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><Shield size={22} /> Steakz</div>
        <nav>
          {staffTabs
            .filter((tab) => tab.visible !== false)
            .map((tab) => (
              <button
                className={staffTab === tab.id ? "active" : ""}
                key={tab.id}
                type="button"
                onClick={() => setStaffTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{roleLabels[user.role]}</p>
            <h1>{user.branchName}</h1>
          </div>
          <button
            className="icon-button"
            type="button"
            title="Sign out"
            onClick={() => {
              localStorage.clear();
              setUser(null);
              setToken("");
            }}
          >
            <LogOut size={18} />
          </button>
        </header>

        {error && <p className="notice">{error}</p>}

        {staffTab === "overview" && profile && (
          <section className="operations-hero">
            <div>
              <p className="eyebrow">{roleLabels[user.role]}</p>
              <h2>{profile.title}</h2>
              <p>{profile.description}</p>
            </div>
            <div className="permission-strip">
              <span>Orders</span>
              {canSeeBookings(user.role) && <span>Reservations</span>}
              {canSeeSales(user.role) && <span>Sales</span>}
              {canSeeShifts(user.role) && <span>Shifts</span>}
              {canSeeUsers(user.role) && <span>User control</span>}
            </div>
          </section>
        )}

        {staffTab === "overview" && (
          <section id="overview" className="metrics">
            <Metric label="Branches" value={data.branches.length} icon={<Building2 />} />
            <Metric label="Total Orders" value={data.orders.length} icon={<ClipboardList />} />
            {canSeeBookings(user.role) && <Metric label="Reservations" value={data.bookings.length} icon={<CalendarDays />} />}
            {canSeeSales(user.role) && <Metric label="Revenue" value={`£${totals.revenue.toFixed(2)}`} icon={<BarChart3 />} />}
            {canSeeUsers(user.role) && <Metric label="Customers" value={totals.customers} icon={<Users />} />}
            {canSeeUsers(user.role) && <Metric label="Users" value={data.users.length} icon={<Users />} />}
            <Metric label="Menu Items" value={menuHighlights.length} icon={<Utensils />} />
            {canSeeShifts(user.role) && <Metric label="Shifts" value={data.shifts.length} icon={<CalendarClock />} />}
          </section>
        )}

        <section className="content-grid">
          {staffTab === "reports" && (user.role === "ADMIN" || user.role === "HEADQUARTER_MANAGER") && (
            <Panel id="reports" title="Headquarters Reports" icon={<BarChart3 />}>
              <section className="report-summary">
                <Metric label="Branches" value={data.branches.length} icon={<Building2 />} />
                <Metric label="Orders" value={data.orders.length} icon={<ClipboardList />} />
                <Metric label="Reservations" value={data.bookings.length} icon={<CalendarDays />} />
                <Metric label="Revenue" value={`£${totals.revenue.toFixed(2)}`} icon={<BarChart3 />} />
              </section>
              <div className="mini-grid">
                <div>
                  <h3>Branch revenue</h3>
                  <Table rows={totals.branchRevenue.map((row) => ({ branch: row.branch, orders: row.orders, revenue: `£${row.revenue.toFixed(2)}` }))} columns={["branch", "orders", "revenue"]} />
                </div>
                <div>
                  <h3>Top items</h3>
                  <Table rows={totals.topItems.map((row) => ({ item: row.item, orders: row.orders }))} columns={["item", "orders"]} />
                </div>
              </div>
            </Panel>
          )}
          {staffTab === "orders" && <Panel id="orders" title="Orders" icon={<ClipboardList />}>
            {user.role !== "CHEF" && (
              <form className="branch-admin-form" onSubmit={handleStaffOrder}>
                <input
                  aria-label="Customer name"
                  placeholder="Customer name"
                  value={staffOrderDraft.customerName}
                  onChange={(event) => setStaffOrderDraft((current) => ({ ...current, customerName: event.target.value }))}
                />
                {!user.branchId && (
                  <select
                    aria-label="Order branch"
                    value={staffOrderDraft.branchId}
                    onChange={(event) => setStaffOrderDraft((current) => ({ ...current, branchId: event.target.value }))}
                  >
                    <option value="">Choose branch</option>
                    {data.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                )}
                <select
                  aria-label="Menu item"
                  value={staffOrderDraft.menuItem}
                  onChange={(event) => setStaffOrderDraft((current) => ({ ...current, menuItem: event.target.value }))}
                >
                  {menuHighlights.map((item) => (
                    <option key={item.name} value={item.name}>{item.name} - £{item.price}</option>
                  ))}
                </select>
                <input
                  aria-label="Quantity"
                  min="1"
                  type="number"
                  value={staffOrderDraft.quantity}
                  onChange={(event) => setStaffOrderDraft((current) => ({ ...current, quantity: Number(event.target.value) }))}
                />
                <select
                  aria-label="Order status"
                  value={staffOrderDraft.status}
                  onChange={(event) => setStaffOrderDraft((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="NEW">Pending</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="SERVED">Served</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button type="submit">Create order</button>
              </form>
            )}
            {user.role === "CHEF" ? (
              <ActionList
                rows={data.orders.map((order) => ({
                  id: order.id,
                  title: order.customerName ?? "Kitchen order",
                  meta: `${order.branch?.name ?? user.branchName} · ${formatOrderItems(order)} · £${order.total}`,
                  status: order.status,
                  actions: [
                    ...(order.status === "NEW" ? [{ label: "Start", onClick: () => handleOrderStatus(order.id, "PREPARING") }] : []),
                    ...(order.status === "NEW" || order.status === "PREPARING" ? [{ label: "Mark ready", onClick: () => handleOrderStatus(order.id, "READY") }] : [])
                  ]
                }))}
              />
            ) : user.role === "WAITER" ? (
              <ActionList
                rows={data.orders.map((order) => ({
                  id: order.id,
                  title: order.customerName ?? "Service order",
                  meta: `${order.branch?.name ?? user.branchName} · ${formatOrderItems(order)} · £${order.total}`,
                  status: order.status,
                  actions: [
                    ...(order.status === "READY" ? [{ label: "Serve", onClick: () => handleOrderStatus(order.id, "SERVED") }] : []),
                    { label: "Edit", onClick: () => handleEditOrder(order) }
                  ]
                }))}
              />
            ) : (
              <ActionList
                rows={data.orders.map((order) => ({
                  id: order.id,
                  title: order.customerName ?? "Walk-in order",
                  meta: `${order.branch?.name ?? user.branchName} · ${formatOrderItems(order)} · £${order.total}`,
                  status: order.status,
                  actions: [
                    { label: "Edit", onClick: () => handleEditOrder(order) },
                    { label: "Preparing", onClick: () => handleOrderStatus(order.id, "PREPARING") },
                    { label: "Ready", onClick: () => handleOrderStatus(order.id, "READY") },
                    { label: "Delete", onClick: () => handleDeleteOrder(order.id) }
                  ]
                }))}
              />
            )}
          </Panel>}
          {staffTab === "receipts" && user.role === "WAITER" && (
            <Panel id="receipts" title="Customer Receipts" icon={<ReceiptText />}>
              <section className="receipt-grid">
                {data.orders.length === 0 ? (
                  <p className="empty-state">No customer receipts for this branch yet.</p>
                ) : data.orders.map((order) => (
                  <article className="receipt-card" key={order.id}>
                    <div className="receipt-head">
                      <span>
                        <small>Receipt</small>
                        <strong>#{order.id.slice(-6).toUpperCase()}</strong>
                      </span>
                      <b>{order.status}</b>
                    </div>
                    <div className="receipt-meta">
                      <span>Customer</span>
                      <strong>{receiptCustomerName(order)}</strong>
                      <span>Branch</span>
                      <strong>{order.branch?.name ?? user.branchName}</strong>
                      <span>Date</span>
                      <strong>{formatOrderDate(order.createdAt)}</strong>
                    </div>
                    <div className="receipt-lines">
                      {(order.items && order.items.length > 0 ? order.items : [{ name: order.customerName ?? "Order", quantity: 1, unitPrice: order.total }]).map((item, index) => (
                        <span key={`${order.id}-${item.name}-${index}`}>
                          {item.quantity}x {item.name}
                          <b>£{Number(item.lineTotal ?? Number(item.unitPrice ?? 0) * item.quantity).toFixed(2)}</b>
                        </span>
                      ))}
                    </div>
                    <div className="receipt-total">
                      <span>Total paid</span>
                      <strong>£{Number(order.total).toFixed(2)}</strong>
                    </div>
                    {order.status === "READY" && (
                      <button type="button" onClick={() => handleOrderStatus(order.id, "SERVED")}>Mark served</button>
                    )}
                  </article>
                ))}
              </section>
            </Panel>
          )}
          {staffTab === "reservations" && canSeeBookings(user.role) && (
            <Panel id="reservations" title="Reservations" icon={<CalendarDays />}>
              {user.role === "WAITER" ? (
                <ActionList
                  rows={data.bookings.map((booking) => ({
                    id: booking.id,
                    title: booking.customerName ?? "Customer",
                    meta: `${booking.branch?.name ?? user.branchName} · ${formatBookingDate(booking.reservationAt)} · ${booking.guests} persons`,
                    status: booking.status,
                    actions: booking.status === "REQUESTED"
                      ? [
                          { label: "Accept", onClick: () => handleBookingStatus(booking.id, "CONFIRMED") },
                          { label: "Cancel", onClick: () => handleBookingStatus(booking.id, "CANCELLED") }
                        ]
                      : []
                  }))}
                />
              ) : (
                <ActionList
                  rows={data.bookings.map((booking) => ({
                    id: booking.id,
                    title: booking.customerName ?? "Customer",
                    meta: `${booking.branch?.name ?? user.branchName} · ${formatBookingDate(booking.reservationAt)} · ${booking.guests} persons`,
                    status: booking.status,
                    actions: [
                      { label: "Confirm", onClick: () => handleBookingStatus(booking.id, "CONFIRMED") },
                      { label: "Edit", onClick: () => handleEditBooking(booking) },
                      { label: "Delete", onClick: () => handleDeleteBooking(booking.id) }
                    ]
                  }))}
                />
              )}
            </Panel>
          )}
          {staffTab === "sales" && canSeeSales(user.role) && (
            <Panel id="sales" title="Sales" icon={<BarChart3 />}>
              <Table rows={data.sales.slice(0, 8).map((sale) => ({ branch: sale.branch?.name, method: sale.paymentMethod, status: sale.status, amount: sale.amount }))} columns={["branch", "method", "status", "amount"]} />
            </Panel>
          )}
          {staffTab === "shifts" && canSeeShifts(user.role) && (
            <Panel id="shifts" title="Shifts" icon={<CalendarClock />}>
              <Table rows={data.shifts.map((shift) => ({ employee: shift.user.name, role: shift.user.role, branch: shift.branch?.name, status: shift.status }))} columns={["employee", "role", "branch", "status"]} />
            </Panel>
          )}
          {staffTab === "branches" && canManageBranchAdmin && <Panel id="branches" title="Branch Management" icon={<Building2 />}>
            <section className="branch-management">
              <div className="branch-management-head">
                <div>
                  <p className="eyebrow">{canControlAllBranches ? "Head Office Administration" : "Assigned Branch"}</p>
                  <h3>Multi-branch restaurant control</h3>
                  <p>Monitor branch performance, staff coverage, reservations, orders, and revenue from one management screen.</p>
                </div>
                {canControlAllBranches && (
                  <button className="gold-button" type="button" onClick={() => {
                    cancelEditBranch();
                    setTimeout(() => document.getElementById("branch-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
                  }}>
                    <Building2 size={18} /> Add Branch
                  </button>
                )}
              </div>

              <div className="branch-toolbar">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    aria-label="Search branches"
                    placeholder="Search by branch, city, or manager"
                    value={branchSearch}
                    onChange={(event) => setBranchSearch(event.target.value)}
                  />
                </label>
                <label className="filter-field">
                  <Filter size={18} />
                  <select
                    aria-label="Filter branch status"
                    value={branchStatusFilter}
                    onChange={(event) => setBranchStatusFilter(event.target.value as "ALL" | BranchStatus)}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
              </div>

              {(canControlAllBranches || editingBranchId) && (
                <form id="branch-form" className={`branch-editor ${editingBranchId ? "editing" : ""}`} onSubmit={editingBranchId ? handleUpdateBranch : handleCreateBranch}>
                  <div className="branch-editor-title">
                    <div>
                      <p className="eyebrow">{editingBranchId ? "Editing selected branch" : "New branch setup"}</p>
                      <h3>{editingBranchId ? "Edit Branch Information" : "Create New Branch"}</h3>
                    </div>
                    {editingBranchId && <button type="button" onClick={cancelEditBranch}><X size={16} /> Cancel edit</button>}
                  </div>
                  <input
                    aria-label="Branch name"
                    placeholder="Branch name"
                    value={branchDraft.name}
                    onChange={(event) => setBranchDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                  <input
                    aria-label="City"
                    placeholder="City"
                    value={branchDraft.city}
                    onChange={(event) => setBranchDraft((current) => ({ ...current, city: event.target.value }))}
                  />
                  <input
                    aria-label="Address"
                    placeholder="Address"
                    value={branchDraft.address}
                    onChange={(event) => setBranchDraft((current) => ({ ...current, address: event.target.value }))}
                  />
                  <input
                    aria-label="Phone"
                    placeholder="Phone"
                    value={branchDraft.phone}
                    onChange={(event) => setBranchDraft((current) => ({ ...current, phone: event.target.value }))}
                  />
                  <select
                    aria-label="Branch status"
                    value={branchDraft.status}
                    disabled={!canControlAllBranches}
                    onChange={(event) => setBranchDraft((current) => ({ ...current, status: event.target.value as BranchStatus }))}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <button type="submit">{editingBranchId ? "Save Branch Changes" : "Create Branch"}</button>
                </form>
              )}

              <div className="branch-admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Branch Name</th>
                      <th>City</th>
                      <th>Branch Manager</th>
                      <th>Staff</th>
                      <th>Orders</th>
                      <th>Reservations</th>
                      <th>Revenue</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBranches.length === 0 ? (
                      <tr><td colSpan={9}>No branches match this search.</td></tr>
                    ) : filteredBranches.map((branch) => (
                      <tr key={branch.id}>
                        <td><strong>{branch.name}</strong><small>{branch.address ?? "No address saved"}</small></td>
                        <td>{branch.city}</td>
                        <td>{branch.manager?.name ?? "Unassigned"}</td>
                        <td>{branch.staffCount ?? 0}</td>
                        <td>{branch.totalOrders ?? 0}</td>
                        <td>{branch.totalReservations ?? 0}</td>
                        <td>£{Number(branch.revenue ?? 0).toFixed(2)}</td>
                        <td><span className={`status-pill ${(branch.status ?? "ACTIVE").toLowerCase()}`}>{branch.status ?? "ACTIVE"}</span></td>
                        <td>
                          <div className="table-actions">
                            <button type="button" title="View branch" onClick={() => loadBranchDetails(branch.id)}><Eye size={16} /></button>
                            <button type="button" title="Edit branch" onClick={() => startEditBranch(branch)}><Edit3 size={16} /></button>
                            {canControlAllBranches && <button type="button" title="Assign manager" onClick={() => {
                              loadBranchDetails(branch.id);
                              setTimeout(() => document.getElementById("manager-assignment")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
                            }}><UserPlus size={16} /></button>}
                            {canControlAllBranches && <button className="danger" type="button" title="Delete branch" onClick={() => handleDeleteBranch(branch.id)}><Trash2 size={16} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedBranchDetails && (
                <section className="branch-details-page">
                  <div className="branch-detail-header">
                    <div>
                      <p className="eyebrow">Branch Details</p>
                      <h3>{selectedBranchDetails.name}</h3>
                      <p>{selectedBranchDetails.address} · {selectedBranchDetails.phone}</p>
                    </div>
                    <span className={`status-pill ${(selectedBranchDetails.status ?? "ACTIVE").toLowerCase()}`}>{selectedBranchDetails.status ?? "ACTIVE"}</span>
                  </div>

                  <div className="branch-detail-metrics">
                    <Metric label="Staff Members" value={selectedBranchDetails.staffCount ?? selectedBranchDetails.users?.length ?? 0} icon={<Users />} />
                    <Metric label="Orders" value={selectedBranchDetails.totalOrders ?? 0} icon={<ClipboardList />} />
                    <Metric label="Reservations" value={selectedBranchDetails.totalReservations ?? 0} icon={<CalendarDays />} />
                    <Metric label="Revenue" value={`£${Number(selectedBranchDetails.revenue ?? 0).toFixed(2)}`} icon={<BarChart3 />} />
                  </div>

                  <div className="branch-detail-grid">
                    <div>
                      <h4>Assigned Manager</h4>
                      <p className="detail-line">{selectedBranchDetails.manager?.name ?? "No manager assigned"}<span>{selectedBranchDetails.manager?.email ?? "Assign one below"}</span></p>
                      {canControlAllBranches && (
                        <div id="manager-assignment" className="manager-assignment">
                          <select value={managerAssignment} onChange={(event) => setManagerAssignment(event.target.value)}>
                            <option value="">Choose Branch Manager</option>
                            {branchManagers.map((manager) => (
                              <option key={manager.id} value={manager.id}>{manager.name} - {manager.email}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => handleAssignManager(selectedBranchDetails.id)}>Assign Manager</button>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4>Revenue Summary</h4>
                      <p className="detail-line">Total revenue<span>£{Number(selectedBranchDetails.revenue ?? 0).toFixed(2)}</span></p>
                      <p className="detail-line">Average order value<span>£{((Number(selectedBranchDetails.revenue ?? 0)) / Math.max(1, selectedBranchDetails.totalOrders ?? 0)).toFixed(2)}</span></p>
                    </div>
                    <div>
                      <h4>Staff List</h4>
                      <Table rows={(selectedBranchDetails.users ?? []).map((account) => ({ name: account.name, role: roleLabels[account.role], email: account.email }))} columns={["name", "role", "email"]} />
                    </div>
                    <div>
                      <h4>Recent Orders</h4>
                      <Table rows={(selectedBranchDetails.orders ?? []).map((order) => ({ customer: order.customerName ?? "Walk-in", items: formatOrderItems(order), status: order.status, total: `£${Number(order.total).toFixed(2)}` }))} columns={["customer", "items", "status", "total"]} />
                    </div>
                    <div>
                      <h4>Recent Reservations</h4>
                      <Table rows={(selectedBranchDetails.bookings ?? []).map((booking) => ({ customer: booking.customerName ?? "Customer", date: formatBookingDate(booking.reservationAt), guests: booking.guests, status: booking.status }))} columns={["customer", "date", "guests", "status"]} />
                    </div>
                    <div>
                      <h4>Performance Statistics</h4>
                      <Table rows={[
                        { metric: "Orders", value: selectedBranchDetails.totalOrders ?? 0 },
                        { metric: "Reservations", value: selectedBranchDetails.totalReservations ?? 0 },
                        { metric: "Staff members", value: selectedBranchDetails.staffCount ?? 0 },
                        { metric: "Revenue", value: `£${Number(selectedBranchDetails.revenue ?? 0).toFixed(2)}` }
                      ]} columns={["metric", "value"]} />
                    </div>
                  </div>
                </section>
              )}
            </section>
          </Panel>}
          {staffTab === "users" && canSeeUsers(user.role) && (
            <Panel id="users" title="Users & Roles" icon={<Users />}>
              <form className="branch-editor user-editor" onSubmit={handleSaveStaff}>
                <div className="branch-editor-title">
                  <div>
                    <p className="eyebrow">{editingUserId ? "Edit account" : "Create account"}</p>
                    <h3>{editingUserId ? "Update user access" : "Add a new user"}</h3>
                  </div>
                  {editingUserId && (
                    <button type="button" onClick={() => resetStaffDraft()}>
                      <X size={16} />
                      Cancel edit
                    </button>
                  )}
                </div>
                <input
                  aria-label="User full name"
                  placeholder="Full name"
                  value={staffDraft.name}
                  onChange={(event) => setStaffDraft((current) => ({ ...current, name: event.target.value }))}
                />
                <input
                  aria-label="User email"
                  placeholder="Email"
                  value={staffDraft.email}
                  onChange={(event) => setStaffDraft((current) => ({ ...current, email: event.target.value.trim() }))}
                />
                <select
                  aria-label="User role"
                  value={staffDraft.role}
                  onChange={(event) => setStaffDraft((current) => ({ ...current, role: event.target.value as Role }))}
                >
                  {editableUserRoles(user.role).map((role) => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
                {user.role !== "BRANCH_MANAGER" && (
                  <select
                    aria-label="User branch"
                    value={staffDraft.branchId}
                    onChange={(event) => setStaffDraft((current) => ({ ...current, branchId: event.target.value }))}
                  >
                    <option value="">Global / no branch</option>
                    {data.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
                    ))}
                  </select>
                )}
                <input
                  aria-label="User password"
                  type="password"
                  placeholder={editingUserId ? "Leave blank to keep password" : "Password"}
                  value={staffDraft.password}
                  onChange={(event) => setStaffDraft((current) => ({ ...current, password: event.target.value }))}
                />
                <button type="submit">{editingUserId ? "Save user changes" : "Add user"}</button>
              </form>

              <div className="branch-admin-table users-admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((account) => {
                      const canManage = canEditAccount(user, account);
                      return (
                        <tr key={account.id}>
                          <td><strong>{account.name}</strong></td>
                          <td>{account.email}</td>
                          <td>{roleLabels[account.role]}</td>
                          <td>{account.branch?.name ?? "Global"}</td>
                          <td>
                            <div className="table-actions">
                              <button type="button" disabled={!canManage} onClick={() => startEditUser(account)} title={canManage ? "Edit user" : "Cannot edit this account"}>
                                <Edit3 size={15} />
                              </button>
                              <button type="button" className="danger" disabled={!canManage} onClick={() => handleDeleteUser(account.id, account.name)} title={canManage ? "Delete user" : "Cannot delete this account"}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </section>
      </section>
    </main>
  );
}

function canSeeSales(role?: Role) {
  return role === "ADMIN" || role === "HEADQUARTER_MANAGER" || role === "BRANCH_MANAGER" || role === "CASHIER";
}

function canSeeShifts(role?: Role) {
  return role === "ADMIN" || role === "HEADQUARTER_MANAGER" || role === "BRANCH_MANAGER" || role === "CHEF" || role === "WAITER";
}

function canSeeBookings(role?: Role) {
  return role === "ADMIN" || role === "HEADQUARTER_MANAGER" || role === "BRANCH_MANAGER" || role === "WAITER";
}

function canSeeUsers(role?: Role) {
  return role === "ADMIN" || role === "HEADQUARTER_MANAGER" || role === "BRANCH_MANAGER";
}

function editableUserRoles(role?: Role): Role[] {
  if (role === "ADMIN") {
    return ["ADMIN", "HEADQUARTER_MANAGER", "BRANCH_MANAGER", "CHEF", "WAITER", "CASHIER", "CUSTOMER"];
  }
  if (role === "HEADQUARTER_MANAGER") {
    return ["BRANCH_MANAGER", "CHEF", "WAITER", "CASHIER"];
  }
  if (role === "BRANCH_MANAGER") {
    return ["CHEF", "WAITER"];
  }
  return [];
}

function canEditAccount(currentUser: SessionUser | null, account: UserRecord) {
  if (!currentUser || currentUser.id === account.id) return false;
  if (currentUser.role === "ADMIN") return true;
  if (currentUser.role === "HEADQUARTER_MANAGER") {
    return ["BRANCH_MANAGER", "CHEF", "WAITER", "CASHIER"].includes(account.role);
  }
  if (currentUser.role === "BRANCH_MANAGER") {
    return account.branchId === currentUser.branchId && ["CHEF", "WAITER"].includes(account.role);
  }
  return false;
}

function receiptCustomerName(order: Order) {
  return (order.customerName || "Guest").split(" - ")[0];
}

function formatOrderDate(value?: string) {
  if (!value) return "Today";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatOrderItems(order: Order) {
  if (order.items?.length) {
    return order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ");
  }
  const note = order.customerName?.split(" - ")[1];
  return note || "Items saved";
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <article className="metric"><span>{icon}</span><p>{label}</p><strong>{value}</strong></article>;
}

function Panel({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section id={id} className="panel"><h2>{icon}{title}</h2>{children}</section>;
}

function ActionList({ rows }: { rows: Array<{ id: string; title: string; meta: string; status: string; actions: Array<{ label: string; onClick: () => void }> }> }) {
  return (
    <div className="action-list">
      {rows.length === 0 ? (
        <p className="empty-state">No records</p>
      ) : rows.map((row) => (
        <article className="action-row" key={row.id}>
          <span>
            <strong>{row.title}</strong>
            <small>{row.meta}</small>
          </span>
          <b>{row.status}</b>
          <div>
            {row.actions.map((action) => (
              <button key={action.label} type="button" onClick={action.onClick}>{action.label}</button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function Table({ rows, columns }: { rows: Record<string, unknown>[]; columns: string[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={columns.length}>No records</td></tr> : rows.map((row, index) => (
            <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column] ?? "-")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

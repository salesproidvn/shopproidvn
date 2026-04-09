// Lightweight replacement for mockData's admin view state
// Used by ShopOwnerDashboard when super admin views another shop's dashboard
let _adminViewShopId = null;

export const setAdminViewShopId = (id) => { _adminViewShopId = id; };
export const getAdminViewShopId = () => _adminViewShopId;

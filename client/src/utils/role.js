export function getRole() {
    try {
        return localStorage.getItem('role') || null;
    } catch (e) {
        return null;
    }
}

export function setRole(role) {
    try {
        localStorage.setItem('role', role);
    } catch (e) { }
}

export function clearRole() {
    try {
        localStorage.removeItem('role');
    } catch (e) { }
}

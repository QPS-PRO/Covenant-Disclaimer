
export const authHeadersJSON = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

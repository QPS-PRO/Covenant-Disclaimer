// frontend/src/utils/authHelpers.js
/**
 * Helper functions for role-based access control
 */

export const isAdmin = (user) => {
    if (!user) return false;
    return user.is_staff === true || user.is_superuser === true;
};

export const isDepartmentManager = (user) => {
    if (!user) return false;
    return user.is_department_manager === true;
};

export const isRegularEmployee = (user) => {
    if (!user) return false;
    // Has employee profile but is NOT admin and NOT manager
    return user.employee_profile && !isAdmin(user) && !isDepartmentManager(user);
};

export const getUserRole = (user) => {
    if (!user) return 'guest';
    if (isAdmin(user)) return 'admin';
    if (isDepartmentManager(user)) return 'manager';
    if (isRegularEmployee(user)) return 'employee';
    return 'guest';
};

export const getDefaultRoute = (user) => {
    if (!user) return '/auth/sign-in';

    const role = getUserRole(user);

    switch (role) {
        case 'admin':
            return '/dashboard/home';
        case 'manager':
            return '/dashboard/disclaimer-requests';
        case 'employee':
            const employeeId = user.employee_profile?.id || user.employee_id;
            
            if (employeeId) {
                return `/dashboard/employees/${employeeId}/profile`;
            }
            
            console.warn('Employee user has no employee_profile.id:', user);
            return '/dashboard/my-disclaimer';
        default:
            return '/auth/sign-in';
    }
};

export const canAccessRoute = (user, requiredRole) => {
    const userRole = getUserRole(user);

    if (requiredRole === 'admin') {
        return userRole === 'admin';
    }

    if (requiredRole === 'manager') {
        return userRole === 'manager';
    }

    if (requiredRole === 'employee') {
        return userRole === 'employee';
    }

    // No specific role required
    return true;
};
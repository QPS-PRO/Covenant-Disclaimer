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
            const managerEmployeeId = user.employee_profile?.id;
            if (managerEmployeeId) {
                return `/dashboard/employees/${managerEmployeeId}/profile`;
            }
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

/**
 * Check if user has report access
 * FIXED: Properly check nested report_permission object
 */
export const hasReportAccess = (user) => {
    if (!user) {
        console.log('hasReportAccess: No user');
        return false;
    }
    
    // Admin always has access
    if (isAdmin(user)) {
        console.log('hasReportAccess: User is admin - GRANTED');
        return true;
    }
    
    // Check employee profile for report permission
    if (user.employee_profile) {
        const reportPerm = user.employee_profile.report_permission;
        
        console.log('hasReportAccess: Checking report permission:', {
            hasPermissionObject: !!reportPerm,
            permissionType: typeof reportPerm,
            canAccess: reportPerm?.can_access_reports,
            fullPermission: reportPerm
        });
        
        // Check if report_permission exists and has can_access_reports set to true
        if (reportPerm && typeof reportPerm === 'object') {
            const hasAccess = reportPerm.can_access_reports === true;
            console.log('hasReportAccess: Final decision -', hasAccess ? 'GRANTED' : 'DENIED');
            return hasAccess;
        }
    }
    
    console.log('hasReportAccess: No permission found - DENIED');
    return false;
};
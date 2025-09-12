// Helper function to parse error messages
const parseErrorMessage = (error) => {
    if (typeof error === 'string') {
        return error;
    }

    if (error.non_field_errors && Array.isArray(error.non_field_errors)) {
        return error.non_field_errors.join('. ');
    }

    if (error.detail) {
        return error.detail;
    }

    if (error.message) {
        return error.message;
    }

    // Handle field-specific errors
    const fieldErrors = [];
    Object.keys(error).forEach(field => {
        if (Array.isArray(error[field])) {
            error[field].forEach(msg => {
                fieldErrors.push(`${field}: ${msg}`);
            });
        } else if (typeof error[field] === 'string') {
            fieldErrors.push(`${field}: ${error[field]}`);
        }
    });

    if (fieldErrors.length > 0) {
        return fieldErrors.join('. ');
    }

    return 'حدث خطأ غير متوقع';
};

export default parseErrorMessage;
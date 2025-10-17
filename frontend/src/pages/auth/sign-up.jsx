// frontend/src/pages/auth/sign-up.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
  Alert,
  Select,
  Option,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/api";
import { departmentAPI } from "@/lib/assetApi";
import { getDefaultRoute } from "@/utils/authHelpers";

export function SignUp() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    employee_id: "",
    phone_number: "",
    department: "",
    password1: "",
    password2: "",
    agree_terms: false,
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [hasRedirected, setHasRedirected] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getPublicList();
      setDepartments(response.results || response);
    } catch (err) {
      setError("Failed to load departments. Please refresh the page.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError("First name is required");
      return false;
    }
    if (!formData.last_name.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.employee_id.trim()) {
      setError("Employee ID is required");
      return false;
    }
    if (!formData.phone_number.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!formData.department) {
      setError("Please select a department");
      return false;
    }
    if (formData.password1.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password1 !== formData.password2) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.agree_terms) {
      setError("You must agree to the terms and conditions");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    setSuccess("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        employee_id: formData.employee_id,
        phone_number: formData.phone_number,
        department: parseInt(formData.department),
        password1: formData.password1,
        password2: formData.password2,
      });

      if (result.success) {
        setSuccess("Registration successful! Redirecting to your profile...");
        setHasRedirected(true);
        // If auto-login after registration is enabled
        setTimeout(() => {
          // For employees, always go to their profile page
          if (result.user && result.user.employee_profile) {
            const employeeId = result.user.employee_profile.id;
            navigate(`/dashboard/employees/${employeeId}/profile`, { replace: true });
          } else {
            // Fallback for other user types
            const redirectTo = result.user ? getDefaultRoute(result.user) : "/dashboard/home";
            navigate(redirectTo, { replace: true });
          }
        }, 2000);
      } else {
        // Check if error is an object with field-specific errors
        if (result.fieldErrors && typeof result.fieldErrors === 'object') {
          setFieldErrors(result.fieldErrors);
          // Also set a general error message
          const firstError = Object.values(result.fieldErrors)[0];
          setError(Array.isArray(firstError) ? firstError[0] : firstError);
        } else {
          setError(result.error || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="m-8 flex">
      <div className="w-2/5 h-full hidden lg:block">
        <img
          src="/img/pattern.png"
          className="h-full w-full object-cover rounded-3xl"
          alt="Sign up"
        />
      </div>
      
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">Join Us Today</Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            Enter your details to create your account.
          </Typography>
        </div>
        
        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={handleSubmit}>
          {error && (
            <Alert color="red" className="mb-6">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert color="green" className="mb-6">
              {success}
            </Alert>
          )}
          
          <div className="mb-1 flex flex-col gap-6">
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              First Name
            </Typography>
            <Input
              size="lg"
              placeholder="John"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              required
            />
            
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Last Name
            </Typography>
            <Input
              size="lg"
              placeholder="Doe"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              required
            />
            
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Your email
            </Typography>
            <Input
              size="lg"
              placeholder="name@mail.com"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              error={!!fieldErrors.email}
              required
            />
            {fieldErrors.email && (
              <Typography variant="small" color="red" className="-mt-4">
                {Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}
              </Typography>
            )}
            
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Employee ID
            </Typography>
            <Input
              size="lg"
              placeholder="1 or EMP123"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleInputChange}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              error={!!fieldErrors.employee_id}
              required
            />
            {fieldErrors.employee_id && (
              <Typography variant="small" color="red" className="-mt-4">
                {Array.isArray(fieldErrors.employee_id) ? fieldErrors.employee_id[0] : fieldErrors.employee_id}
              </Typography>
            )}
            
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Phone Number
            </Typography>
            <Input
              size="lg"
              placeholder="+1234567890"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              error={!!fieldErrors.phone_number}
              required
            />
            {fieldErrors.phone_number && (
              <Typography variant="small" color="red" className="-mt-4">
                {Array.isArray(fieldErrors.phone_number) ? fieldErrors.phone_number[0] : fieldErrors.phone_number}
              </Typography>
            )}
            
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Department
            </Typography>
            <Select
              size="lg"
            
              value={formData.department}
              onChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              className="!border-t-blue-gray-200 focus:!border-t-gray-900"
              menuProps={{ className: "max-h-72" }}
              selected={(element) => {
                if (React.isValidElement(element) && element.props?.children != null) {
                  return element.props.children;
                }
                const raw = typeof element === "string" || typeof element === "number" 
                  ? String(element) 
                  : formData.department ?? "";
                if (!raw) return "Select Department";
                const dept = departments.find((d) => d.id.toString() === raw);
                return dept ? dept.name : "Select Department";
              }}
            >
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </Option>
              ))}
            </Select>
            
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Password
            </Typography>
            <Input
              type="password"
              size="lg"
              placeholder="********"
              name="password1"
              value={formData.password1}
              onChange={handleInputChange}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              error={!!fieldErrors.password1}
              required
            />
            {fieldErrors.password1 && (
              <Typography variant="small" color="red" className="-mt-4">
                {Array.isArray(fieldErrors.password1) ? fieldErrors.password1[0] : fieldErrors.password1}
              </Typography>
            )}
            
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Confirm Password
            </Typography>
            <Input
              type="password"
              size="lg"
              placeholder="********"
              name="password2"
              value={formData.password2}
              onChange={handleInputChange}
              className=" !border-t-blue-gray-200 focus:!border-t-gray-900"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              required
            />
          </div>
          
          <Checkbox
            name="agree_terms"
            checked={formData.agree_terms}
            onChange={handleInputChange}
            label={
              <Typography
                variant="small"
                color="gray"
                className="flex items-center justify-start font-medium"
              >
                I agree to the&nbsp;
                <a
                  href="#"
                  className="font-normal text-black transition-colors hover:text-gray-900 underline"
                >
                  Terms and Conditions
                </a>
              </Typography>
            }
            containerProps={{ className: "-ml-2.5" }}
          />
          
          <Button className="mt-6" fullWidth type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Register Now"}
          </Button>
          
          <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">
            Already have an account?
            <Link to="/auth/sign-in" className="text-gray-900 ml-1">Sign in</Link>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;
import { useState } from "react";
import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
  Alert,
} from "@material-tailwind/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/api";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { getDefaultRoute } from "@/utils/authHelpers";

export function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Get the page user was trying to access
  // const from = location.state?.from?.pathname || "/dashboard/home";

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        const redirectTo = location.state?.from?.pathname || getDefaultRoute(result.user);
        navigate(redirectTo, { replace: true });
      } else {
        setError(result.error || t('auth.loginFailed'));
      }
    } catch (err) {
      setError(err.message || t('errors.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`m-8 flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className="w-full lg:w-3/5 mt-24">
        <div className={`text-center ${isRTL ? 'text-right' : ''}`}>
          <Typography variant="h2" className="font-bold mb-4">
            {t('auth.signIn')}
          </Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
            {t('auth.enterEmailPassword')}
          </Typography>
        </div>

        <form className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2" onSubmit={handleSubmit}>
          {error && (
            <Alert color="red" className="mb-6">
              {error}
            </Alert>
          )}

          <div className="mb-1 flex flex-col gap-6">
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              {t('auth.email')}
            </Typography>
            <Input
              size="lg"
              placeholder="name@mail.com"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`!border-t-blue-gray-200 focus:!border-t-gray-900 ${isRTL ? 'text-right' : ''}`}
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              required
            />
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              {t('auth.password')}
            </Typography>
            <Input
              type="password"
              size="lg"
              placeholder="********"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`!border-t-blue-gray-200 focus:!border-t-gray-900 ${isRTL ? 'text-right' : ''}`}
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              required
            />
          </div>

          <Checkbox
            name="remember"
            checked={formData.remember}
            onChange={handleInputChange}
            label={
              <Typography
                variant="small"
                color="gray"
                className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'} font-medium`}
              >
                {t('auth.rememberMe')}
              </Typography>
            }
            containerProps={{ className: `${isRTL ? '-mr-2.5' : '-ml-2.5'}` }}
          />

          <Button className="mt-6" fullWidth type="submit" disabled={loading}>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>

          <div className={`flex items-center justify-between gap-2 mt-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div />
            <Typography variant="small" className="font-medium text-gray-900">
              <Link to="/auth/forgot-password">
                {t('auth.forgotPassword')}
              </Link>
            </Typography>
          </div>

          <Typography variant="paragraph" className={`text-center text-blue-gray-500 font-medium mt-4 ${isRTL ? 'text-right' : ''}`}>
            {t('auth.notRegistered')}
            <Link to="/auth/sign-up" className={`text-gray-900 ${isRTL ? 'mr-1' : 'ml-1'}`}>
              {t('auth.createAccount')}
            </Link>
          </Typography>
        </form>
      </div>

      <div className={`w-2/5 h-full hidden lg:block ${isRTL ? 'order-first' : ''}`}>
        <img
          src="/img/pattern.png"
          className="h-full w-full object-cover rounded-3xl"
          alt="Sign in"
        />
      </div>
    </section>
  );
}

export default SignIn;
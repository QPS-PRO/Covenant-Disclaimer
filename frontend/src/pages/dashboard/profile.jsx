// frontend/src/pages/dashboard/profile.jsx
import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Avatar,
  Typography,
  Tabs,
  TabsHeader,
  Tab,
  Switch,
  Tooltip,
  Button,
  Input,
  Alert,
} from "@material-tailwind/react";
import {
  HomeIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { ProfileInfoCard, MessageCard } from "@/widgets/cards";
import { useAuth } from "@/lib/api";
import { apiPatch } from "@/lib/api";

export function Profile() {
  const { user, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("app");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiPatch('/api/users/update-profile/', {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditMode(false);
      
      // Refresh user data
      await checkAuth();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
    setEditMode(false);
    setMessage({ type: '', text: '' });
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>
      
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          {message.text && (
            <Alert 
              color={message.type === 'success' ? 'green' : 'red'} 
              className="mb-6"
            >
              {message.text}
            </Alert>
          )}
          
          <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <Avatar
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=0d47a1&color=fff&size=128`}
                alt={`${user.first_name} ${user.last_name}`}
                size="xl"
                variant="rounded"
                className="rounded-lg shadow-lg shadow-blue-gray-500/40"
              />
              <div>
                <Typography variant="h5" color="blue-gray" className="mb-1">
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-600"
                >
                  {user.email}
                </Typography>
              </div>
            </div>
            
            <div className="w-96">
              <Tabs value={activeTab} onChange={setActiveTab}>
                <TabsHeader>
                  <Tab value="app" onClick={() => setActiveTab("app")}>
                    <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    App
                  </Tab>
                  <Tab value="message" onClick={() => setActiveTab("message")}>
                    <ChatBubbleLeftEllipsisIcon className="-mt-0.5 mr-2 inline-block h-5 w-5" />
                    Message
                  </Tab>
                  <Tab value="settings" onClick={() => setActiveTab("settings")}>
                    <Cog6ToothIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Settings
                  </Tab>
                </TabsHeader>
              </Tabs>
            </div>
          </div>
          
          <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
            {/* Profile Information Card */}
            <div>
              <Card color="transparent" shadow={false}>
                <CardHeader
                  color="transparent"
                  shadow={false}
                  floated={false}
                  className="mx-0 mt-0 mb-4 flex items-center justify-between gap-4"
                >
                  <Typography variant="h6" color="blue-gray">
                    Profile Information
                  </Typography>
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <Button
                          size="sm"
                          color="green"
                          onClick={handleSave}
                          loading={loading}
                          className="px-3"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outlined"
                          onClick={handleCancel}
                          className="px-3"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Tooltip content="Edit Profile">
                        <PencilIcon 
                          className="h-4 w-4 cursor-pointer text-blue-gray-500 hover:text-blue-500"
                          onClick={() => setEditMode(true)}
                        />
                      </Tooltip>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="p-0">
                  <Typography
                    variant="small"
                    className="font-normal text-blue-gray-500 mb-4"
                  >
                    Hi, I'm {user.first_name} {user.last_name}. Welcome to my profile!
                  </Typography>
                  
                  <hr className="my-8 border-blue-gray-50" />
                  
                  <ul className="flex flex-col gap-4 p-0">
                    <li className="flex items-center gap-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-semibold capitalize min-w-[100px]"
                      >
                        First Name:
                      </Typography>
                      {editMode ? (
                        <Input
                          size="sm"
                          name="first_name"
                          value={profileData.first_name}
                          onChange={handleInputChange}
                          className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                        />
                      ) : (
                        <Typography
                          variant="small"
                          className="font-normal text-blue-gray-500"
                        >
                          {user.first_name}
                        </Typography>
                      )}
                    </li>
                    
                    <li className="flex items-center gap-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-semibold capitalize min-w-[100px]"
                      >
                        Last Name:
                      </Typography>
                      {editMode ? (
                        <Input
                          size="sm"
                          name="last_name"
                          value={profileData.last_name}
                          onChange={handleInputChange}
                          className="!border-t-blue-gray-200 focus:!border-t-gray-900"
                        />
                      ) : (
                        <Typography
                          variant="small"
                          className="font-normal text-blue-gray-500"
                        >
                          {user.last_name}
                        </Typography>
                      )}
                    </li>
                    
                    <li className="flex items-center gap-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-semibold capitalize min-w-[100px]"
                      >
                        Email:
                      </Typography>
                      <Typography
                        variant="small"
                        className="font-normal text-blue-gray-500"
                      >
                        {user.email}
                      </Typography>
                    </li>
                    
                    <li className="flex items-center gap-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-semibold capitalize min-w-[100px]"
                      >
                        Member Since:
                      </Typography>
                      <Typography
                        variant="small"
                        className="font-normal text-blue-gray-500"
                      >
                        {new Date(user.date_joined).toLocaleDateString()}
                      </Typography>
                    </li>
                  </ul>
                </CardBody>
              </Card>
            </div>
            
            {/* Settings Panel */}
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                Account Settings
              </Typography>
              <div className="flex flex-col gap-12">
                <div>
                  <Typography className="mb-4 block text-xs font-semibold uppercase text-blue-gray-500">
                    Account
                  </Typography>
                  <div className="flex flex-col gap-6">
                    <Switch
                      id="email-notifications"
                      label="Email notifications"
                      defaultChecked={true}
                      labelProps={{
                        className: "text-sm font-normal text-blue-gray-500",
                      }}
                    />
                    <Switch
                      id="push-notifications"
                      label="Push notifications"
                      defaultChecked={false}
                      labelProps={{
                        className: "text-sm font-normal text-blue-gray-500",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Typography className="mb-4 block text-xs font-semibold uppercase text-blue-gray-500">
                    Application
                  </Typography>
                  <div className="flex flex-col gap-6">
                    <Switch
                      id="new-launches"
                      label="New launches and projects"
                      defaultChecked={true}
                      labelProps={{
                        className: "text-sm font-normal text-blue-gray-500",
                      }}
                    />
                    <Switch
                      id="monthly-newsletter"
                      label="Monthly product updates"
                      defaultChecked={true}
                      labelProps={{
                        className: "text-sm font-normal text-blue-gray-500",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-3">
                Recent Activity
              </Typography>
              <ul className="flex flex-col gap-6">
                <MessageCard
                  img={`https://ui-avatars.com/api/?name=System&background=6366f1&color=fff`}
                  name="System"
                  message="Welcome to your dashboard! Get started by exploring the features."
                  action={
                    <Button variant="text" size="sm">
                      View
                    </Button>
                  }
                />
                <MessageCard
                  img={`https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff`}
                  name="Admin"
                  message="Your account has been successfully created and verified."
                  action={
                    <Button variant="text" size="sm">
                      View
                    </Button>
                  }
                />
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

export default Profile;
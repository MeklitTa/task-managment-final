import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadTheme } from "../features/themeSlice";
import { Loader2Icon } from "lucide-react";
import {
  useUser,
  SignIn,
  useAuth,
  CreateOrganization,
  useOrganizationList,
} from "@clerk/clerk-react";
import { fetchWorkspaces, clearWorkspaces } from "../features/workspaceSlice";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { loading, workspaces } = useSelector((state) => state.workspace);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { setActive, organizationList } = useOrganizationList();
  const lastCheckedOrgIdsRef = useRef("");

  // Initial load of theme
  useEffect(() => {
    dispatch(loadTheme(isLoaded && user && workspaces.length === 0));
  }, []);
  // Clear workspaces when user logs out
  useEffect(() => {
    if (isLoaded && !user) {
      dispatch(clearWorkspaces());
      lastCheckedOrgIdsRef.current = "";
    }
  }, [isLoaded, user, dispatch]);

  // Track user sessions to ensure fresh fetch on login
  const lastUserIdRef = useRef(null);
  const hasFetchedForUserRef = useRef(false);

  // Fetch workspaces on login - always fetch when user logs in
  useEffect(() => {
    if (isLoaded && user) {
      const userIdChanged = lastUserIdRef.current !== user.id;
      
      // Reset refs when user changes (new login)
      if (userIdChanged) {
        lastUserIdRef.current = user.id;
        lastCheckedOrgIdsRef.current = "";
        hasFetchedForUserRef.current = false;
      }
      
      // Fetch workspaces if we haven't fetched for this user yet
      if (!hasFetchedForUserRef.current && !loading) {
        hasFetchedForUserRef.current = true;
        
        // If organizationList is available, use it to track
        if (organizationList && organizationList.length > 0) {
          const currentOrgIds = organizationList.map(org => org.id).sort().join(',');
          lastCheckedOrgIdsRef.current = currentOrgIds;
        }
        
        // Fetch workspaces - small delay to ensure Clerk is fully initialized
        const timer = setTimeout(() => {
          dispatch(fetchWorkspaces({ getToken }));
        }, 100);
        return () => clearTimeout(timer);
      }
    } else if (!user) {
      // Reset when user logs out
      lastUserIdRef.current = null;
      lastCheckedOrgIdsRef.current = "";
      hasFetchedForUserRef.current = false;
    }
  }, [user, isLoaded, loading, organizationList, getToken, dispatch]);

  // Also fetch if organizationList becomes available and we have no workspaces
  useEffect(() => {
    if (isLoaded && user && organizationList && organizationList.length > 0 && workspaces.length === 0 && !loading && hasFetchedForUserRef.current) {
      // OrganizationList loaded but we have no workspaces - fetch again
      const timer = setTimeout(() => {
        dispatch(fetchWorkspaces({ getToken }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [organizationList, workspaces.length, isLoaded, user, loading, getToken, dispatch]);

  // Refresh workspaces when organization list changes (after creation, joining, or removal)
  useEffect(() => {
    if (isLoaded && user && organizationList && organizationList.length > 0 && !loading && workspaces.length > 0) {
      const currentOrgIds = organizationList.map(org => org.id).sort().join(',');
      
      // Only check if organization list has actually changed
      if (currentOrgIds !== lastCheckedOrgIdsRef.current) {
        lastCheckedOrgIdsRef.current = currentOrgIds;
        
        // Get current workspace IDs from Redux
        const currentWorkspaceIds = new Set(workspaces.map(ws => ws.id));
        
        // Check if there's a new organization that's not in our workspace list
        const hasNewOrganization = organizationList.some(org => !currentWorkspaceIds.has(org.id));
        
        // Check if we're missing any organizations (detect removals)
        const missingOrganizations = Array.from(currentWorkspaceIds).some(wsId => 
          !organizationList.some(org => org.id === wsId)
        );
        
        // Refresh if we detect changes
        if (hasNewOrganization || missingOrganizations) {
          const timer = setTimeout(() => {
            dispatch(fetchWorkspaces({ getToken }));
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [organizationList, isLoaded, user, getToken, dispatch, loading, workspaces]);

  // Navigate to sign-in page when user logs out
  useEffect(() => {
    if (isLoaded && !user && location.pathname !== "/sign-in" && location.pathname !== "/sign-up" && location.pathname !== "/create-organization") {
      navigate("/sign-in");
    }
  }, [isLoaded, user, navigate, location.pathname]);

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Show sign in page if user is not authenticated - redirect to sign-in route
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
        <SignIn 
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          redirectUrl="/"
        />
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-7 text-blue-500 animate-spin" />
      </div>
    );
  if (user && workspaces.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white dark:bg-zinc-950 p-4">
        <div className="w-full max-w-md">
          <CreateOrganization 
            routing="path"
            path="/create-organization"
            afterCreateOrganizationUrl="/"
            skipInvitationScreen={true}
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg",
              }
            }}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;

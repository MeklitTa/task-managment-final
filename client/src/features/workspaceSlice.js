import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { dummyWorkspaces } from "../assets/assets";
import api from "../configs/api";

export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async ({ getToken }) => {
    try {
      const { data } = await api.get("/api/workspaces", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      return data.workspaces || [];
    } catch (error) {
      console.log(error?.response?.data?.message || error.message);
      return [];
    }
  }
);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload;
    },
    setCurrentWorkspace: (state, action) => {
      localStorage.setItem("currentWorkspaceId", action.payload);
      state.currentWorkspace = state.workspaces.find(
        (w) => w.id === action.payload
      );
    },
    addWorkspace: (state, action) => {
      state.workspaces.push(action.payload);

      // set current workspace to the new workspace
      if (state.currentWorkspace?.id !== action.payload.id) {
        state.currentWorkspace = action.payload;
      }
    },
    updateWorkspace: (state, action) => {
      state.workspaces = state.workspaces.map((w) =>
        w.id === action.payload.id ? action.payload : w
      );

      // if current workspace is updated, set it to the updated workspace
      if (state.currentWorkspace?.id === action.payload.id) {
        state.currentWorkspace = action.payload;
      }
    },
    deleteWorkspace: (state, action) => {
      state.workspaces = state.workspaces.filter(
        (w) => w._id !== action.payload
      );
    },
    addProject: (state, action) => {
      state.currentWorkspace.projects.push(action.payload);
      // find workspace by id and add project to it
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? { ...w, projects: w.projects.concat(action.payload) }
          : w
      );
    },
    updateProject: (state, action) => {
      const updatedProject = action.payload;
      
      // Update project in current workspace
      if (state.currentWorkspace) {
        state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) =>
          p.id === updatedProject.id ? updatedProject : p
        );
      }
      
      // Update project in workspaces array
      state.workspaces = state.workspaces.map((w) =>
        w.id === updatedProject.workspaceId || (state.currentWorkspace && w.id === state.currentWorkspace.id)
          ? {
              ...w,
              projects: w.projects.map((p) =>
                p.id === updatedProject.id ? updatedProject : p
              ),
            }
          : w
      );
    },
    addTask: (state, action) => {
      state.currentWorkspace.projects = state.currentWorkspace.projects.map(
        (p) => {
          console.log(
            p.id,
            action.payload.projectId,
            p.id === action.payload.projectId
          );
          if (p.id === action.payload.projectId) {
            p.tasks.push(action.payload);
          }
          return p;
        }
      );

      // find workspace and project by id and add task to it
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: w.projects.map((p) =>
                p.id === action.payload.projectId
                  ? { ...p, tasks: p.tasks.concat(action.payload) }
                  : p
              ),
            }
          : w
      );
    },
    updateTask: (state, action) => {
      const updatedTask = action.payload;
      const projectId = updatedTask.projectId;
      
      if (!projectId) {
        console.warn('updateTask: projectId is missing', updatedTask);
        return;
      }

      // Helper function to update task in projects array
      const updateTaskInProjects = (projects) => {
        return projects.map((p) => {
          if (p.id === projectId) {
            // Find if task exists in this project
            const taskIndex = p.tasks.findIndex((t) => t.id === updatedTask.id);
            
            if (taskIndex >= 0) {
              // Task exists, update it
              return {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === updatedTask.id ? updatedTask : t
                ),
              };
            } else {
              // Task doesn't exist, add it (shouldn't happen but handle gracefully)
              return {
                ...p,
                tasks: [...(p.tasks || []), updatedTask],
              };
            }
          }
          return p;
        });
      };

      // Update task in all workspaces
      state.workspaces = state.workspaces.map((w) => ({
        ...w,
        projects: updateTaskInProjects(w.projects || []),
      }));
      
      // Update task in current workspace (ensure new reference for React to detect change)
      if (state.currentWorkspace) {
        const updatedWorkspace = state.workspaces.find((w) => w.id === state.currentWorkspace.id);
        if (updatedWorkspace) {
          state.currentWorkspace = updatedWorkspace;
        } else {
          // Fallback: update projects directly if workspace not found in list
          state.currentWorkspace.projects = updateTaskInProjects(state.currentWorkspace.projects || []);
        }
      }
    },
    deleteTask: (state, action) => {
      state.currentWorkspace.projects.map((p) => {
        p.tasks = p.tasks.filter((t) => !action.payload.includes(t.id));
        return p;
      });
      // find workspace and project by id and delete task from it
      state.workspaces = state.workspaces.map((w) =>
        w.id === state.currentWorkspace.id
          ? {
              ...w,
              projects: w.projects.map((p) =>
                p.id === action.payload.projectId
                  ? {
                      ...p,
                      tasks: p.tasks.filter(
                        (t) => !action.payload.includes(t.id)
                      ),
                    }
                  : p
              ),
            }
          : w
      );
    },
    clearWorkspaces: (state) => {
      state.workspaces = [];
      state.currentWorkspace = null;
      state.loading = false;
      localStorage.removeItem("currentWorkspaceId");
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchWorkspaces.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchWorkspaces.fulfilled, (state, action) => {
      // Preserve current workspace ID before updating
      const currentWorkspaceId = state.currentWorkspace?.id || localStorage.getItem("currentWorkspaceId");
      
      // Update workspaces array
      state.workspaces = action.payload || [];
      
      if (state.workspaces.length > 0) {
        // Try to preserve the current workspace selection
        if (currentWorkspaceId) {
          const findWorkspace = state.workspaces.find(
            (w) => w.id === currentWorkspaceId
          );

          if (findWorkspace) {
            // Keep the existing workspace if it still exists in the list
            state.currentWorkspace = findWorkspace;
            localStorage.setItem("currentWorkspaceId", currentWorkspaceId);
          } else {
            // Current workspace no longer exists, set to first available
            state.currentWorkspace = state.workspaces[0];
            localStorage.setItem("currentWorkspaceId", state.workspaces[0].id);
          }
        } else {
          // No current workspace, set to first available
          state.currentWorkspace = state.workspaces[0];
          localStorage.setItem("currentWorkspaceId", state.workspaces[0].id);
        }
      } else {
        // No workspaces available
        state.currentWorkspace = null;
        localStorage.removeItem("currentWorkspaceId");
      }

      state.loading = false;
    });

    builder.addCase(fetchWorkspaces.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const {
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addProject,
  updateProject,
  addTask,
  updateTask,
  deleteTask,
  clearWorkspaces,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;

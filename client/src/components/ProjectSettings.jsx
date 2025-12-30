import { format } from "date-fns";
import { Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import AddProjectMember from "./AddProjectMember";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import { fetchWorkspaces, updateProject as updateProjectAction } from "../features/workspaceSlice";

export default function ProjectSettings({ project }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { currentWorkspace } = useSelector((state) => state.workspace);

  const [formData, setFormData] = useState({
    name: "New Website Launch",
    description: "Initial launch for new web platform.",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "2025-09-10",
    end_date: "2025-10-15",
    progress: 30,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.loading("saving...");
    try {
      // Convert date objects to ISO 8601 format strings
      // Only include fields allowed by UpdateProjectDto (exclude team_members and team_lead)
      const payload = {
        id: project.id,
        workspaceId: project.workspaceId || currentWorkspace?.id,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        progress: formData.progress,
        // Convert Date objects or ISO strings to ISO 8601 format
        start_date: formData.start_date
          ? (formData.start_date instanceof Date 
              ? formData.start_date.toISOString()
              : typeof formData.start_date === 'string' && formData.start_date.includes('T')
              ? formData.start_date
              : new Date(formData.start_date + 'T00:00:00.000Z').toISOString())
          : undefined,
        end_date: formData.end_date
          ? (formData.end_date instanceof Date
              ? formData.end_date.toISOString()
              : typeof formData.end_date === 'string' && formData.end_date.includes('T')
              ? formData.end_date
              : new Date(formData.end_date + 'T00:00:00.000Z').toISOString())
          : undefined,
      };
      
      const { data } = await api.put("/api/projects", payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      // Update local formData and Redux state with the response immediately
      if (data.project) {
        // Update local form state
        setFormData({
          ...formData,
          ...data.project,
          start_date: data.project.start_date ? new Date(data.project.start_date) : null,
          end_date: data.project.end_date ? new Date(data.project.end_date) : null,
        });
        
        // Update Redux state immediately for instant UI update
        dispatch(updateProjectAction(data.project));
      }

      setIsDialogOpen(false);
      // Also refresh workspaces to ensure everything is in sync (runs in background)
      dispatch(fetchWorkspaces({ getToken }));
      toast.dismissAll();
      toast.success(data.message || "Project updated successfully");
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (project) {
      // Initialize formData with proper formatting
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "PLANNING",
        priority: project.priority || "MEDIUM",
        start_date: project.start_date 
          ? (project.start_date instanceof Date 
              ? project.start_date 
              : new Date(project.start_date))
          : null,
        end_date: project.end_date
          ? (project.end_date instanceof Date
              ? project.end_date
              : new Date(project.end_date))
          : null,
        progress: project.progress ?? 0,
        team_members: project.team_members || [],
        team_lead: project.team_lead || "",
      });
    }
  }, [project]);

  const inputClasses =
    "w-full px-3 py-2 rounded mt-2 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300";

  const cardClasses =
    "rounded-lg border p-6 not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";

  const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Project Details */}
      <div className={cardClasses}>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
          Project Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className={labelClasses}>Project Name</label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={inputClasses}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className={labelClasses}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={inputClasses + " h-24"}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClasses}>Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className={inputClasses}
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelClasses}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className={inputClasses}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClasses}>Start Date</label>
              <input
                type="date"
                value={formData.start_date 
                  ? format(formData.start_date instanceof Date ? formData.start_date : new Date(formData.start_date), "yyyy-MM-dd")
                  : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    start_date: e.target.value ? new Date(e.target.value) : null,
                  })
                }
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>End Date</label>
              <input
                type="date"
                value={formData.end_date
                  ? format(formData.end_date instanceof Date ? formData.end_date : new Date(formData.end_date), "yyyy-MM-dd")
                  : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    end_date: e.target.value ? new Date(e.target.value) : null,
                  })
                }
                className={inputClasses}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <label className={labelClasses}>
              Progress: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={(e) =>
                setFormData({ ...formData, progress: Number(e.target.value) })
              }
              className="w-full accent-blue-500 dark:accent-blue-400"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto flex items-center text-sm justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded"
          >
            <Save className="size-4" />{" "}
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Team Members */}
      <div className="space-y-6">
        <div className={cardClasses}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
              Team Members{" "}
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                ({project.members.length})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
            </button>
            <AddProjectMember
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
            />
          </div>

          {/* Member List */}
          {project.members.length > 0 && (
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {project.members.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 rounded dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300"
                >
                  <span> {member?.user?.email || "Unknown"} </span>
                  {project.team_lead === member.user.id && (
                    <span className="px-2 py-0.5 rounded-xs ring ring-zinc-200 dark:ring-zinc-600">
                      Team Lead
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

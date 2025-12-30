import { FolderOpen, CheckCircle, Users, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function StatsGrid() {
    const currentWorkspace = useSelector(
        (state) => state?.workspace?.currentWorkspace || null
    );

    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTasks: 0,
        activeProjects: 0,
        completedTasks: 0,
        myTasks: 0,
        overdueIssues: 0,
    });

    const statCards = [
        {
            icon: FolderOpen,
            title: "Total Projects",
            value: stats.totalProjects,
            subtitle: `projects in ${currentWorkspace?.name}`,
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-500",
        },
        {
            icon: CheckCircle,
            title: "Total Tasks",
            value: stats.totalTasks,
            subtitle: `all tasks`,
            bgColor: "bg-indigo-500/10",
            textColor: "text-indigo-500",
        },
        {
            icon: CheckCircle,
            title: "Completed Tasks",
            value: stats.completedTasks,
            subtitle: `tasks done`,
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-500",
        },
        {
            icon: Users,
            title: "My Tasks",
            value: stats.myTasks,
            subtitle: "assigned to me",
            bgColor: "bg-purple-500/10",
            textColor: "text-purple-500",
        },
        {
            icon: AlertTriangle,
            title: "Overdue",
            value: stats.overdueIssues,
            subtitle: "need attention",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-500",
        },
    ];

  useEffect(() => {
    if (currentWorkspace && currentWorkspace.projects) {
      // Calculate all tasks from all projects
      const allTasks = currentWorkspace.projects.flatMap((p) => p.tasks || []);
      
      // Calculate completed tasks (tasks with status "DONE")
      const completedTasks = allTasks.filter((t) => t.status === "DONE").length || 0;
      
      // Calculate completed projects (projects with status "COMPLETED")
      const completedProjectsCount = currentWorkspace.projects.filter(
        (p) => p.status === "COMPLETED"
      ).length || 0;
      
      // Calculate total tasks count
      const totalTasksCount = allTasks.length || 0;
      
      // Get current user email from workspace owner for "My Tasks" calculation
      const ownerEmail = currentWorkspace.owner?.email;
      const ownerId = currentWorkspace.owner?.id;
      
      setStats({
        totalProjects: currentWorkspace.projects.length || 0,
        totalTasks: totalTasksCount, // Total number of all tasks
        activeProjects: currentWorkspace.projects.filter(
          (p) => p.status !== "CANCELLED" && p.status !== "COMPLETED"
        ).length || 0,
        completedTasks: completedTasks, // Tasks with status "DONE"
        myTasks: allTasks.filter((t) => 
          t.assigneeId === ownerId || 
          t.assignee?.id === ownerId || 
          t.assignee?.email === ownerEmail
        ).length || 0,
        overdueIssues: allTasks.filter((t) => 
          t.due_date && new Date(t.due_date) < new Date() && t.status !== "DONE"
        ).length || 0,
      });
    } else {
      // Reset stats if no workspace
      setStats({
        totalProjects: 0,
        totalTasks: 0,
        activeProjects: 0,
        completedTasks: 0,
        myTasks: 0,
        overdueIssues: 0,
      });
    }
  }, [currentWorkspace]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 my-9">
            {statCards.map(
                ({ icon: Icon, title, value, subtitle, bgColor, textColor }, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-950 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 rounded-md" >
                        <div className="p-6 py-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                                        {title}
                                    </p>
                                    <p className="text-3xl font-bold text-zinc-800 dark:text-white">
                                        {value}
                                    </p>
                                    {subtitle && (
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20`}>
                                    <Icon size={20} className={textColor} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

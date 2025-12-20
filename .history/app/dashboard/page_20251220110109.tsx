"use client";
import { useEffect, useState } from "react";
import { supabase, Project } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/");
    } else {
      setUser(session.user);
      fetchProjects(session.user.id);
    }
  };

  const fetchProjects = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      alert("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: newProjectName.trim(),
          theme: "neutral",
          header_text: "",
          use_default_music: false,
          automatic_mode: false,
        })
        .select()
        .single();

      if (error) throw error;

      setShowNewProjectModal(false);
      setNewProjectName("");
      router.push(`/project/${data.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1
                className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
                style={{
                  fontFamily: '"Lobster", sans-serif',
                }}
              >
                CircleCards
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.user_metadata?.full_name || user?.email}!
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My CircleCards</h2>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New CircleCard
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first CircleCard project to get started!
            </p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/project/${project.id}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6 border-2 border-gray-100 hover:border-purple-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(project.updated_at)}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      project.theme === "birthday"
                        ? "bg-pink-100 text-pink-700"
                        : project.theme === "christmas"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {project.theme.charAt(0).toUpperCase() +
                      project.theme.slice(1)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Click to edit
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Who is your CircleCard for?
            </h2>
            <p className="text-gray-600 mb-6">Enter the recipient's name</p>

            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateProject()}
              placeholder="e.g., John Smith"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleCreateProject}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName("");
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all shadow-md font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

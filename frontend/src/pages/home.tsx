import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/projects");
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const projects = await res.json();
      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects().then((data) => {
      if (data) {
        setProjects(data);
        console.log("Fetched projects:", data);
      }
    });
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Projects</h1>
        <Button className="ml-auto" size="sm" onClick={() => router.push("/addProject")}>
          Add Project
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {projects.map((project: any) => (
          <Card
            key={project._id}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => router.push(`/project/${project._id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {project.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}